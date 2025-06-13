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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

interface DeleteProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProjectIds: string[];
  selectedProjectNames: string[];
  onProjectsDeleted?: () => void;
}

export function DeleteProjectsDialog({
  open,
  onOpenChange,
  selectedProjectIds,
  selectedProjectNames,
  onProjectsDeleted,
}: DeleteProjectsDialogProps) {
  const { toast } = useToast();

  const deleteMultipleProjects = api.project.removeMultipleProjects.useMutation(
    {
      onSuccess: (result) => {
        toast({
          title: "Success",
          description: `${result.deletedCount} project${result.deletedCount > 1 ? "s" : ""} deleted successfully`,
        });
        onProjectsDeleted?.();
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    },
  );

  const handleConfirm = async () => {
    if (selectedProjectIds.length === 0) return;

    try {
      await deleteMultipleProjects.mutateAsync(selectedProjectIds);
    } catch (error) {
      console.error("Failed to delete projects:", error);
    }
  };

  const projectCount = selectedProjectIds.length;
  const projectNames = selectedProjectNames.slice(0, 3).join(", ");
  const hasMoreProjects = selectedProjectNames.length > 3;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Projects</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {projectCount} project
            {projectCount > 1 ? "s" : ""}?
            {projectCount <= 3 ? (
              <span className="block mt-2 font-medium">{projectNames}</span>
            ) : (
              <span className="block mt-2 font-medium">
                {projectNames}
                {hasMoreProjects &&
                  ` and ${selectedProjectNames.length - 3} more`}
              </span>
            )}
            <span className="block mt-2 text-destructive">
              This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMultipleProjects.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 text-white"
            onClick={handleConfirm}
            disabled={deleteMultipleProjects.isPending}
          >
            {deleteMultipleProjects.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
