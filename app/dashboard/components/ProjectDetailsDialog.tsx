import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { addProviderKey, generateApiKey, getApiKeys, getProviderKeys, removeApiKey, removeProject } from "../../services/hydra.service";
import { APIKeyResponseDto, ProjectResponseDto, ProviderKeyResponseDto } from "../types/types";

interface ProjectDetailsDialogProps {
  project: ProjectResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectDeleted?: () => void;
}

interface AlertState {
  show: boolean;
  title: string;
  description: string;
  action: () => Promise<void>;
  data?: { id: string };
}

export function ProjectDetailsDialog({
  project,
  open,
  onOpenChange,
  onProjectDeleted,
}: ProjectDetailsDialogProps) {
  const [apiKeys, setApiKeys] = useState<APIKeyResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    title: '',
    description: '',
    action: async () => {},
  });
  const { toast } = useToast();
  const [isEditingProviderKey, setIsEditingProviderKey] = useState(false);
  const [providerKey, setProviderKey] = useState('');
  const [providerKeys, setProviderKeys] = useState<ProviderKeyResponseDto[]>([]);

  useEffect(() => {
    if (open) {
      loadApiKeys();
      loadProviderKeys();
    }
  }, [open, project.id]);

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      const keys = await getApiKeys(project.id);
      setApiKeys(keys);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProviderKeys = async () => {
    try {
      setIsLoading(true);
      const keys = await getProviderKeys(project.id);
      setProviderKeys(keys);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load provider keys",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a key name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const newKey = await generateApiKey(project.id, newKeyName);
      setNewGeneratedKey(newKey);
      await loadApiKeys();
      setNewKeyName("");
      setShowNameInput(false);
      toast({
        title: "Success",
        description: "New API key created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteApiKey = async () => {
    try {
      if (!alertState.data) return;
      await removeApiKey(project.id, alertState.data?.id);
      await loadApiKeys();
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    } finally {
      setAlertState({ show: false, title: '', description: '', action: async () => {}, data: undefined });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateApiKey();
    }
  };

  const handleDeleteProject = async () => {
    try {
      await removeProject(project.id);
      onOpenChange(false);
      onProjectDeleted?.();
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
    finally {
      setAlertState({ show: false, title: '', description: '', action: async () => {}, data: undefined });
    }
  };

  const handleUpdateProviderKey = async () => {
    try {
      await addProviderKey(project.id, "openai", providerKey);
      await loadProviderKeys();
      setIsEditingProviderKey(false);
      toast({
        title: "Success",
        description: "Provider key updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update provider key",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            {typeof project.name === 'string' ? project.name : project.name.projectName}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setAlertState({
                show: true,
                title: "Delete Project",
                description: "Are you sure you want to delete this project? This action cannot be undone.",
                action: handleDeleteProject,
              })}
            >
              Delete Project
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold">Project ID</h4>
              <p className="text-sm text-muted-foreground">{project.id}</p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">OpenAI API Key</h4>
                {isEditingProviderKey ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdateProviderKey}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingProviderKey(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingProviderKey(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
              {isEditingProviderKey ? (
                <input
                  type="text"
                  value={providerKey}
                  onChange={(e) => setProviderKey(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                  placeholder="Enter OpenAI API Key"
                  autoFocus
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Loading...' : (
                    providerKeys.length > 0 
                      ? (providerKeys[providerKeys.length - 1].partiallyHiddenKey 
                        ? providerKeys[providerKeys.length - 1].partiallyHiddenKey.slice(0, 15) 
                        : `${providerKeys[providerKeys.length - 1].providerKeyEncrypted.slice(0, 15)}...`)
                      : 'No provider key set'
                  )}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">API Keys</h4>
                {showNameInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Enter key name"
                      className="px-2 py-1 text-sm border rounded"
                      disabled={isCreating}
                      autoFocus
                      onKeyDown={handleKeyPress}
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateApiKey}
                      disabled={isCreating}
                    >
                      {isCreating ? "Creating..." : "Create"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowNameInput(false);
                        setNewKeyName("");
                      }}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setShowNameInput(true)}
                  >
                    Create New Key
                  </Button>
                )}
              </div>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <>
                  {newGeneratedKey && (
                    <div className="mb-4 p-4 border border-green-200 rounded-lg bg-green-50 space-y-2">
                      <p className="text-sm font-medium">New API Key Generated</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={newGeneratedKey}
                          className="flex-1 px-2 py-1 text-sm border rounded bg-white"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(newGeneratedKey);
                            toast({
                              title: "Copied!",
                              description: "API key copied to clipboard",
                            });
                          }}
                        >
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setNewGeneratedKey(null)}
                        >
                          Dismiss
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Make sure to copy this key now. You won't be able to see it again!
                      </p>
                    </div>
                  )}
                  {apiKeys.length > 0 ? (
                    <div className="space-y-2">
                      {apiKeys.map((key) => (
                        <div
                          key={key.id}
                          className="p-3 rounded-lg bg-muted/60 space-y-1 max-w-full"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">{key.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {key.lastUsed 
                                  ? `Last used: ${DateTime.fromISO(key.lastUsed).toFormat("EEE MMM d 'at' h:mma")}`
                                  : 'Never used'}
                              </p>
                              <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis">
                                {key.partiallyHiddenKey.slice(0, 15)}
                              </p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setAlertState({
                                show: true,
                                title: "Delete API Key",
                                description: "Are you sure you want to delete this API key? This action cannot be undone.",
                                action: handleDeleteApiKey,
                                data: { id: key.id }
                              })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No API keys available</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Replace existing AlertDialog with generic version */}
        <AlertDialog 
          open={alertState.show} 
          onOpenChange={(open) => !open && setAlertState({ show: false, title: '', description: '', action: async () => {}, data: undefined })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{alertState.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {alertState.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={alertState.action}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
} 