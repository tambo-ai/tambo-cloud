import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { memo, useCallback } from "react";
import { CreateProjectDialogState } from "../types";

interface CreateProjectDialogProps {
  state: Readonly<CreateProjectDialogState>;
  isCreating: boolean;
  onStateChange: (state: CreateProjectDialogState) => void;
  onConfirm: () => Promise<void>;
}

/**
 * CreateProjectDialog Component
 *
 * Dialog for creating new projects:
 * - Input field for project name
 * - Validation for empty names
 * - Loading state during creation
 * - Keyboard support (Enter to submit)
 */
export const CreateProjectDialog = memo(function CreateProjectDialog({
  state,
  isCreating,
  onStateChange,
  onConfirm,
}: CreateProjectDialogProps) {
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      onStateChange(
        isOpen ? { ...state, isOpen } : { isOpen: false, name: "" },
      );
    },
    [state, onStateChange],
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onStateChange({ ...state, name: e.target.value });
    },
    [state, onStateChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !isCreating && state.name.trim()) {
        e.preventDefault();
        onConfirm();
      }
    },
    [isCreating, state.name, onConfirm],
  );

  return (
    <Dialog open={state.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter a name for your new project. This will be used to organize
            your API keys.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <input
            type="text"
            value={state.name}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            placeholder="My Project"
            className="w-full px-3 py-2 border rounded-md text-sm"
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isCreating || !state.name.trim()}
          >
            {isCreating ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
