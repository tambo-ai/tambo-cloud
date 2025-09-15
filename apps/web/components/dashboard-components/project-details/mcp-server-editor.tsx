import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { MCPTransport } from "@tambo-ai-cloud/core";
import { useMutation } from "@tanstack/react-query";
import { TRPCClientErrorLike } from "@trpc/client";
import { Check, Info, Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { HeadersEditor, type HeaderKV } from "./headers-editor";
import { McpServerToolsDialog } from "./mcp-server-tools-dialog";

export interface MCPServerInfo {
  id: string;
  url: string | null;
  customHeaders: Record<string, string>;
  mcpTransport?: MCPTransport;
  mcpRequiresAuth?: boolean;
  mcpIsAuthed?: boolean;
}

interface McpServerEditorProps {
  server: MCPServerInfo;
  isEditing: boolean;
  isNew: boolean;
  error: Error | TRPCClientErrorLike<any> | null;
  isSaving: boolean;
  isDeleting: boolean;
  errorMessage: string | null;
  hideEditButtons?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (serverInfo: {
    url: string;
    customHeaders: Record<string, string>;
    mcpTransport: MCPTransport;
  }) => Promise<MCPServerInfo | undefined>;
  onDelete: () => Promise<void>;
  projectId?: string;
  redirectToAuth?: (url: string) => void;
}

export function McpServerEditor({
  server,
  isEditing,
  isNew,
  error,
  isSaving,
  isDeleting,
  errorMessage,
  hideEditButtons = false,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  projectId,
  redirectToAuth,
}: McpServerEditorProps) {
  const [mcpTransport, setMcpTransport] = useState<MCPTransport>(
    server.mcpTransport || MCPTransport.SSE,
  );
  const [url, setUrl] = useState(server.url || (isNew ? "https://" : ""));
  const [headers, setHeaders] = useState<HeaderKV[]>(
    Object.entries(server.customHeaders).map(([header, value]) => ({
      header,
      value,
    })),
  );
  const [isInspecting, setIsInspecting] = useState(false);
  const {
    data: authResult,
    mutateAsync: startAuth,
    isPending: isAuthPending,
    error: authError,
  } = api.tools.authorizeMcpServer.useMutation({
    onSuccess: (authResult) => {
      if (authResult.redirectUrl && redirectToAuth) {
        redirectToAuth(authResult.redirectUrl);
      }
    },
  });

  const inputRef = useRef<HTMLInputElement>(null);
  // Dynamic IDs based on server ID
  const urlInputId = useId();
  const transportId = useId();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(0, inputRef.current.value.length);
    }
  }, [isEditing]);

  // Reset form when server changes
  useEffect(() => {
    setMcpTransport(server.mcpTransport || MCPTransport.SSE);
    setUrl(server.url || (isNew ? "https://" : ""));
    setHeaders(
      Object.entries(server.customHeaders).map(([header, value]) => ({
        header,
        value,
      })),
    );
  }, [server, isNew]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };
  const {
    mutate: mutateSave,
    data: saveResult,
    error: saveError,
  } = useMutation({
    mutationFn: async (input: {
      url: string;
      customHeaders: Record<string, string>;
      mcpTransport: MCPTransport;
    }) => {
      if (!input.url.trim()) return;
      return await onSave(input);
    },
  });

  const handleSave = () => {
    const trimmedUrl = url.trim();
    const customHeaders: Record<string, string> = Object.fromEntries(
      headers
        .map(({ header, value }) => [header.trim(), value] as const)
        .filter(([key]) => Boolean(key)),
    );
    mutateSave({ url: trimmedUrl, customHeaders, mcpTransport });
  };

  // Compute auth/editability state before defining debouncedSave
  const mcpRequiresAuth = saveResult?.mcpRequiresAuth || server.mcpRequiresAuth;
  const mcpIsAuthed = saveResult?.mcpIsAuthed || server.mcpIsAuthed;
  const canEditHeaders = isEditing || (!!mcpRequiresAuth && !mcpIsAuthed);

  // Use debounced callback for auto-save
  const debouncedSave = useDebouncedCallback(async () => {
    // Save in two cases:
    // 1) Inline autosave mode while editing normally
    // 2) During auth flow when headers are editable but not in standard edit mode
    if ((hideEditButtons && isEditing) || (canEditHeaders && !isEditing)) {
      handleSave();
    }
  }, 500);

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (hideEditButtons && isEditing) {
      await debouncedSave();
    }
  };

  const handleTransportChange = async (value: string) => {
    setMcpTransport(value as MCPTransport);
    if (hideEditButtons && isEditing) {
      await debouncedSave();
    }
  };

  const showAuthButton =
    !!mcpRequiresAuth &&
    !mcpIsAuthed &&
    !authResult?.redirectUrl &&
    projectId &&
    redirectToAuth;
  return (
    <div className="flex flex-col gap-2 rounded-md max-w-xl">
      <div className="flex flex-col gap-1">
        <label htmlFor={urlInputId} className="block text-sm font-medium">
          Server URL
        </label>
        <div className="flex items-center gap-2">
          <Input
            id={urlInputId}
            ref={inputRef}
            value={url}
            disabled={!isEditing}
            onChange={handleUrlChange}
            onKeyDown={handleKeyDown}
            placeholder={isNew ? "Enter server URL" : undefined}
            className={`flex-1 rounded-lg ${error ? "border-destructive" : ""}`}
          />
          {!hideEditButtons && (
            <>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSave()}
                    disabled={isSaving || !url.trim()}
                    className="font-sans bg-transparent hover:bg-accent text-sm"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="font-sans bg-transparent text-red-500 hover:bg-red-500/10 hover:text-red-500 text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  {(!server.mcpRequiresAuth || server.mcpIsAuthed) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsInspecting(true)}
                      title="Inspect tools"
                      className="font-sans bg-transparent hover:bg-muted text-sm"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="font-sans border bg-transparent hover:bg-accent text-sm"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="font-sans hover:bg-red-500/10 text-red-500 hover:text-red-500 text-sm"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
        {errorMessage && (
          <p className="text-sm text-destructive px-2">{errorMessage}</p>
        )}
        {saveError && (
          <p className="text-sm text-destructive px-2">{saveError.message}</p>
        )}
        {server.mcpRequiresAuth && (
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Requires Authorization</span>
            </div>
            <div className="flex items-center gap-2">
              <Check
                className={`h-4 w-4 ${server.mcpIsAuthed ? "text-green-500" : "text-gray-300"}`}
              />
              <span className="text-sm">Authorization Established</span>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {showAuthButton && (
            <Button
              variant="outline"
              disabled={isAuthPending}
              onClick={async () =>
                await startAuth({
                  contextKey: null, // for now we don't have a context key, this isn't per-user
                  toolProviderId: server.id,
                })
              }
            >
              Begin Authorization
            </Button>
          )}
          {authError && (
            <p className="text-sm text-destructive px-2">{authError.message}</p>
          )}
        </div>
      </div>
      <div>
        <label htmlFor={transportId} className="block text-sm font-medium">
          Server Type
        </label>
        <Select
          value={mcpTransport}
          onValueChange={handleTransportChange}
          disabled={!isEditing}
        >
          <SelectTrigger className="w-full rounded-lg mt-1">
            <SelectValue placeholder="Select transport type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={MCPTransport.SSE}>SSE</SelectItem>
            <SelectItem value={MCPTransport.HTTP}>HTTP Streamable</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mt-1">Custom Headers</label>
        <HeadersEditor
          headers={headers}
          onSave={async (updated) => {
            setHeaders(updated);
            // When user explicitly saves a row, persist immediately if editable
            if (canEditHeaders) {
              handleSave();
            } else if (hideEditButtons) {
              await debouncedSave();
            }
          }}
          className={
            !canEditHeaders ? "pointer-events-none opacity-50" : undefined
          }
        />
      </div>

      {projectId && (
        <McpServerToolsDialog
          open={isInspecting}
          onOpenChange={setIsInspecting}
          projectId={projectId}
          serverId={server.id}
        />
      )}
    </div>
  );
}
