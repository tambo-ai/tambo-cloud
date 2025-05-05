import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { useState } from "react";

interface CustomInstructionsEditorProps {
  project: { id: string; name: string; customInstructions?: string | null };
  onEdited?: () => void;
}

export function CustomInstructionsEditor({
  project,
  onEdited,
}: CustomInstructionsEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customInstructions, setCustomInstructions] = useState(
    project.customInstructions || "",
  );

  const updateProject = api.project.updateProject.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      onEdited?.();
    },
  });

  const handleSave = async () => {
    updateProject.mutate({
      projectId: project.id,
      customInstructions,
    });
  };

  const handleCancel = () => {
    setCustomInstructions(project.customInstructions || "");
    setIsEditing(false);
  };

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm font-heading font-semibold">
          Custom Instructions
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          These instructions are added to each conversation and help guide AI
          responses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isEditing ? (
            <>
              <div className="min-h-[100px] whitespace-pre-wrap rounded-md border border-muted bg-muted/50 p-3 text-sm">
                {project.customInstructions || "No custom instructions set."}
              </div>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </>
          ) : (
            <>
              <Textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Add custom instructions for your project..."
                className="min-h-[200px] w-full"
              />
              <div className="flex space-x-2">
                <Button onClick={handleSave} disabled={updateProject.isPending}>
                  {updateProject.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateProject.isPending}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
