"use client";

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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { z } from "zod";

export const MultiComponentResultsEditorPropsSchema = z.object({
  project: z
    .object({
      id: z.string().describe("The unique identifier for the project."),
      enableMultiComponentUI: z
        .boolean()
        .describe(
          "If true, the agent may return multiple UI components per turn.",
        ),
    })
    .describe("The project to configure multi-component UI results for."),
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe("Optional callback triggered when the setting is updated."),
  proposedValue: z
    .boolean()
    .optional()
    .describe(
      "Optional proposed value to prefill the toggle from chat; user must click Save to persist.",
    ),
});

interface MultiComponentResultsEditorProps {
  project: {
    id: string;
    enableMultiComponentUI: boolean;
  };
  onEdited?: () => void;
  proposedValue?: boolean;
}

export function MultiComponentResultsEditor({
  project,
  onEdited,
  proposedValue,
}: MultiComponentResultsEditorProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [enableMulti, setEnableMulti] = useState<boolean>(false);

  const { mutateAsync: updateProject, isPending: isUpdating } =
    api.project.updateProject.useMutation();

  useEffect(() => {
    if (typeof proposedValue === "boolean") {
      setEnableMulti(proposedValue);
      setIsEditing(true);
    } else {
      setEnableMulti(project?.enableMultiComponentUI ?? false);
    }
  }, [project?.enableMultiComponentUI, proposedValue]);

  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Multiple component results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-current" />
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    try {
      await updateProject({
        projectId: project?.id ?? "",
        enableMultiComponentUI: enableMulti,
      });

      toast({
        title: "Success",
        description: "Multiple component results updated successfully",
      });

      setIsEditing(false);
      onEdited?.();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEnableMulti(project.enableMultiComponentUI ?? false);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Multiple component results
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Beta
          </Badge>
        </div>
        <CardDescription className="text-sm font-sans text-foreground max-w-md">
          Allow the assistant to return multiple UI components in a single
          response. This feature is experimental and may change.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="enableMulti">
                      Enable multiple component results
                    </Label>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Changes take effect only after clicking Save.
                    </p>
                  </div>
                  <Switch
                    id="enableMulti"
                    checked={enableMulti}
                    onCheckedChange={setEnableMulti}
                    disabled={isUpdating}
                  />
                </div>
                <motion.div
                  className="flex gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button onClick={handleSave} disabled={isUpdating}>
                    {isUpdating ? (
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent border-current" />
                        Saving...
                      </span>
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="display"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Current setting</p>
                    <p className="text-2xl font-bold">
                      {project.enableMultiComponentUI ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  </motion.div>
                </div>
                <div className="text-xs text-amber-600">
                  Warning: You must click Save to apply changes.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
