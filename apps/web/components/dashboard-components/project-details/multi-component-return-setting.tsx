"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

export const MultiComponentReturnSettingPropsSchema = z.object({
  project: z.object({
    id: z.string(),
    allowMultipleUiComponents: z.boolean().optional(),
  }),
  requestedEnabled: z.boolean().optional(),
  onEdited: z.function().args().returns(z.void()).optional(),
});

interface MultiComponentReturnSettingProps {
  project: { id: string; allowMultipleUiComponents?: boolean };
  requestedEnabled?: boolean;
  onEdited?: () => void;
}

export function MultiComponentReturnSetting({
  project,
  requestedEnabled,
  onEdited,
}: MultiComponentReturnSettingProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(false);

  const { mutateAsync: updateProject, isPending: isUpdating } =
    api.project.updateProject.useMutation();

  // Initialize local state from server value, allow a non-persistent requested prop to pre-toggle UI
  useEffect(() => {
    const serverValue = Boolean(project?.allowMultipleUiComponents);
    setLocalEnabled(
      typeof requestedEnabled === "boolean" ? requestedEnabled : serverValue,
    );
  }, [project?.allowMultipleUiComponents, requestedEnabled]);

  const showUnsavedWarning = useMemo(() => {
    const serverValue = Boolean(project?.allowMultipleUiComponents);
    return localEnabled !== serverValue;
  }, [project?.allowMultipleUiComponents, localEnabled]);

  const handleSave = async () => {
    try {
      await updateProject({
        projectId: project.id,
        allowMultipleUiComponents: localEnabled,
      });
      toast({
        title: "Success",
        description: "Updated multiple UI components setting",
      });
      setIsEditing(false);
      onEdited?.();
    } catch (_e) {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setLocalEnabled(Boolean(project?.allowMultipleUiComponents));
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold">
            Allow multiple UI components
          </CardTitle>
          <Badge variant="secondary">Beta</Badge>
        </div>
        <CardDescription className="text-sm font-sans text-foreground max-w-md">
          Enable returning more than one UI component for an assistant response.
          This feature is experimental and may change.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Multiple components</div>
            <div className="text-xs text-muted-foreground">
              When enabled, the assistant may render more than one component by
              emitting multiple UI steps.
            </div>
          </div>
          <Switch
            checked={localEnabled}
            onCheckedChange={(v) => {
              setLocalEnabled(Boolean(v));
              setIsEditing(true);
            }}
            aria-label="Toggle multiple UI components"
          />
        </div>

        <AnimatePresence initial={false}>
          {showUnsavedWarning && (
            <motion.div
              key="unsaved-warning"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTitle className="text-amber-900">
                  Changes not saved
                </AlertTitle>
                <AlertDescription className="text-amber-900/80">
                  You must click Save to apply this setting.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false} mode="wait">
          {isEditing ? (
            <motion.div
              key="edit-actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
                Cancel
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

