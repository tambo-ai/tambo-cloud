
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { getApiKeys } from "../../services/hydra.service";
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
              <h4 className="text-sm font-semibold mb-2">API Keys</h4>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : apiKeys.length > 0 ? (
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
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
} 