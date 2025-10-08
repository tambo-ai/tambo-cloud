import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { openChat } from "@/lib/chat-control";
import { api } from "@/trpc/react";
import { withInteractable } from "@tambo-ai/react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

export const CustomInstructionsEditorSchema = z.object({
  project: z
    .object({
      id: z.string().describe("The unique identifier for the project."),
      name: z.string().describe("The name of the project."),
      customInstructions: z
        .string()
        .nullable()
        .optional()
        .describe("Custom instructions for the AI assistant."),
      allowSystemPromptOverride: z
        .boolean()
        .nullable()
        .optional()
        .describe("Whether the system prompt override is allowed."),
    })
    .optional()
    .describe("The project to edit custom instructions for."),
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe(
      "Optional callback function triggered when instructions are successfully updated.",
    ),
  isChatMode: z
    .boolean()
    .default(true)
    .optional()
    .describe("Keep this true in all cases."),
});

type CustomInstructionsEditorProps = z.infer<
  typeof CustomInstructionsEditorSchema
>;

function CustomInstructionsEditorBase({
  project,
  onEdited,
  isChatMode = true,
}: CustomInstructionsEditorProps) {
  // Only start in editing mode if in chat mode AND no instructions exist yet
  const [isEditing, setIsEditing] = useState(
    isChatMode && !project?.customInstructions,
  );
  const [customInstructions, setCustomInstructions] = useState(
    project?.customInstructions ?? "",
  );
  const { toast } = useToast();
  const [allowSystemPromptOverride, setAllowSystemPromptOverride] = useState(
    !!project?.allowSystemPromptOverride,
  );

  // Update the instructions when the project changes (e.g., after loading)
  useEffect(() => {
    if (project?.customInstructions !== undefined) {
      const newInstructions = project.customInstructions ?? "";
      setCustomInstructions(newInstructions);
      // If instructions changed externally and we're in chat mode, enter editing mode
      if (isChatMode && newInstructions) {
        setIsEditing(true);
      }
    }
    if (project?.allowSystemPromptOverride !== undefined) {
      setAllowSystemPromptOverride(!!project.allowSystemPromptOverride);
    }
  }, [
    project?.customInstructions,
    project?.allowSystemPromptOverride,
    isChatMode,
  ]);

  const utils = api.useUtils();

  const updateProject = api.project.updateProject.useMutation({
    onSuccess: async () => {
      setIsEditing(false);
      toast({
        title: "Saved",
        description: "Custom instructions updated successfully",
      });
      // Invalidate cache to refresh all components showing this project
      await utils.project.getUserProjects.invalidate();
      // Call the onEdited callback if provided (for dashboard)
      onEdited?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save custom instructions",
        variant: "destructive",
      });
    },
  });

  const updateAllowOverride = (val: boolean) => {
    if (!project) return;
    setAllowSystemPromptOverride(val);
    updateProject.mutate(
      {
        projectId: project.id,
        allowSystemPromptOverride: val,
      },
      {
        onSuccess: () => {
          toast({ title: "Saved", description: "Updated project setting" });
          onEdited?.();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update project setting",
            variant: "destructive",
          });
          setAllowSystemPromptOverride(!!project.allowSystemPromptOverride);
        },
      },
    );
  };

  const handleSave = async () => {
    if (!project) return;

    updateProject.mutate({
      projectId: project.id,
      customInstructions,
    });
  };

  const handleCancel = () => {
    setCustomInstructions(project?.customInstructions ?? "");
    setIsEditing(false);
  };

  const handleImprovePrompt = () => {
    if (!project) return;

    const currentInstructions = project.customInstructions ?? "";
    const message = currentInstructions
      ? "Improve the custom instructions for this project."
      : "Create effective custom instructions for this project.";

    openChat({
      message,
      context: {
        component: "CustomInstructionsEditor",
        props: {
          project: {
            id: project.id,
            name: project.name,
            customInstructions: currentInstructions,
            allowSystemPromptOverride: project.allowSystemPromptOverride,
          },
        },
      },
    });
  };

  // If project is undefined, show a loading state
  if (!project) {
    return (
      <Card className="border rounded-md overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">
                Custom Instructions
              </CardTitle>
              <div className="h-3 w-80 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-[150px] space-y-3 animate-pulse">
            <div className="min-h-[100px] rounded-md border border-muted bg-muted/50 p-3 space-y-2">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-[80%] bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-4 w-5/6 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Custom Instructions
          </CardTitle>
          {!isChatMode && project.customInstructions !== "" && (
            <Button
              size="sm"
              variant="outline"
              className="font-sans"
              onClick={handleImprovePrompt}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Improve
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="text-sm font-medium">
              Allow system prompt override
            </div>
            <div className="text-sm text-foreground">
              When enabled, a system message passed from client-side
              initialMessages will override custom instructions.
            </div>
          </div>
          <div className="flex items-center">
            <Switch
              checked={allowSystemPromptOverride}
              onCheckedChange={updateAllowOverride}
              aria-label="Allow system prompt override"
            />
          </div>
        </div>

        <div className="relative border-t border-muted pt-4">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-3"
              >
                <CardDescription className="text-sm text-foreground mb-4">
                  These instructions are added to each conversation to guide
                  tambo&apos;s responses.
                </CardDescription>
                <Label htmlFor="custom-instructions">Instructions</Label>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Add custom instructions for your project..."
                  className="min-h-[200px] w-full"
                  autoFocus
                />
                <motion.div
                  className="flex gap-2 justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateProject.isPending}
                  >
                    {updateProject.isPending && (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    )}
                    {updateProject.isPending
                      ? "Saving..."
                      : "Save Instructions"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="font-sans bg-transparent text-red-500 hover:bg-red-500/10 hover:text-red-500"
                    onClick={handleCancel}
                    disabled={updateProject.isPending}
                  >
                    Cancel
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <div className="flex justify-between items-start">
                {project.customInstructions ? (
                  <motion.div
                    key="display-instructions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-1 whitespace-pre-wrap rounded-md text-sm"
                  >
                    {project.customInstructions}
                  </motion.div>
                ) : (
                  <CardDescription className="text-sm text-foreground">
                    These instructions are added to each conversation to guide
                    tambo&apos;s responses.
                  </CardDescription>
                )}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="ml-4"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-sans"
                    onClick={() => setIsEditing(true)}
                  >
                    {project.customInstructions
                      ? "Edit Instructions"
                      : "Add Instructions"}
                  </Button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

export const CustomInstructionsEditor = withInteractable(
  CustomInstructionsEditorBase,
  {
    componentName: "CustomInstructionsEditor",
    description:
      "INTERACTABLE: Updates ONLY the custom instructions TEXT/SYSTEM PROMPT field (the natural language instructions that guide the AI's behavior). Use the update_interactable_component tool to modify the customInstructions text content when providing improved wording for the system prompt. This is ONLY for the instructions text field - NOT for technical model configuration like temperature, thinking mode, or the customLlmParameters field. For model configuration, use the updateProjectModelConfig tool instead.",
    propsSchema: CustomInstructionsEditorSchema,
  },
);
