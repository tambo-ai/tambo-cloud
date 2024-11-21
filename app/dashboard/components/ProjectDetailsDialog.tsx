import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { generateApiKey, getApiKeys } from "../../services/hydra.service";
import { APIKeyResponseDto, ProjectResponseDto } from "../types/types";

interface ProjectDetailsDialogProps {
  project: ProjectResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetailsDialog({
  project,
  open,
  onOpenChange,
}: ProjectDetailsDialogProps) {
  const [apiKeys, setApiKeys] = useState<APIKeyResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadApiKeys();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{project.name.projectName}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold">Project ID</h4>
              <p className="text-sm text-muted-foreground">{project.id}</p>
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
                          className="p-3 rounded-lg bg-muted/60 space-y-1 max-w-full "
                        >
                          <p className="text-sm font-medium">{key.name}</p>
                          <p className="text-sm text-muted-foreground">{key.lastUsed ? `Last used: ${key.lastUsed.toLocaleString()}` : 'Never used'}</p>
                          <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis">{key.partiallyHiddenKey.slice(0, 15)}</p>
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

      </DialogContent>
    </Dialog>
  );
} 