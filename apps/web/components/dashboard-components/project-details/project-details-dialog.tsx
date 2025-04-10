import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { ProjectResponseDto } from "../../../app/(authed)/dashboard/types/types";
import { APIKeyList } from "./api-key-list";
import { DeleteAlertDialog } from "./delete-alert-dialog";
import { ProjectInfo } from "./project-info";
import { ProviderKeySection } from "./provider-key-section";

interface ProjectDetailsDialogProps {
  project: ProjectResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectDeleted?: () => void;
}

export interface AlertState {
  show: boolean;
  title: string;
  description: string;
  data?: { id: string };
}

const fadeInVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

export function ProjectDetailsDialog({
  project,
  open,
  onOpenChange,
  onProjectDeleted,
}: ProjectDetailsDialogProps) {
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
  });
  const { toast } = useToast();

  const { mutateAsync: deleteProject, isPending: isDeleting } =
    api.project.removeProject.useMutation();

  const handleDeleteProject = async () => {
    try {
      await deleteProject(project.id);
      onOpenChange(false);
      onProjectDeleted?.();
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setAlertState({
        show: false,
        title: "",
        description: "",
        data: undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">
            {project.name}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence>
          {open && (
            <div className="py-4 space-y-6">
              <motion.div
                variants={fadeInVariants}
                initial="hidden"
                animate="visible"
                custom={0}
                key="project-info"
              >
                <ProjectInfo project={project} />
              </motion.div>

              <motion.div
                variants={fadeInVariants}
                initial="hidden"
                animate="visible"
                custom={1}
                key="provider-key"
              >
                <ProviderKeySection project={project} />
              </motion.div>

              <motion.div
                variants={fadeInVariants}
                initial="hidden"
                animate="visible"
                custom={2}
                key="api-keys"
              >
                <APIKeyList project={project} />
              </motion.div>

              <motion.div
                variants={fadeInVariants}
                initial="hidden"
                animate="visible"
                custom={3}
                key="danger-zone"
              >
                <div className="pt-2">
                  <Separator className="mb-4" />
                  <div className="bg-destructive/5 p-4 rounded-md border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <h4 className="text-sm font-heading font-semibold text-destructive">
                        Danger Zone
                      </h4>
                    </div>
                    <p className="text-xs font-sans text-muted-foreground mb-3">
                      Deleting this project will permanently remove all
                      associated data, API keys, and settings. This action
                      cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2 font-sans"
                      onClick={() =>
                        setAlertState({
                          show: true,
                          title: "Delete Project",
                          description:
                            "Are you sure you want to delete this project? This action cannot be undone.",
                        })
                      }
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? "Deleting..." : "Delete Project"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <DeleteAlertDialog
          alertState={alertState}
          setAlertState={setAlertState}
          onConfirm={handleDeleteProject}
        />
      </DialogContent>
    </Dialog>
  );
}
