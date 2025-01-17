"use client";

import { Bell, Settings, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CanvasDropdown } from "./CanvasDropdown";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EmailSubscriptionForm } from "./EmailSubscriptionForm";
import { useActiveTab } from "@/contexts/ActiveTabContext";
import { useChatStore } from "@/store/chatStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  loadCanvasesFromStorage,
  saveCanvasesToStorage,
  resetAllCanvasState,
} from "@/utils/canvas";
import { cn } from "@/lib/utils";

export function CanvasHeader() {
  const { activeTab, setActiveTab } = useActiveTab();

  return (
    <div className="border-b">
      <TopBar />
      <BottomBar activeTab={activeTab || "canvas"} onTabChange={setActiveTab} />
    </div>
  );
}

function TopBar() {
  const clearMessages = useChatStore((state) => state.clearMessages);
  const clearCanvas = useCanvasStore((state) => state.clearCanvas);

  const handleReset = () => {
    clearMessages();
    clearCanvas();
  };

  const handleResetAll = () => {
    clearMessages();
    clearCanvas();
    resetAllCanvasState();
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-between px-4 h-12 border-b">
      <span className="font-semibold">Analytics Canvas</span>
      <div className="flex items-center space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <EmailSubscriptionForm />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Settings</h4>
              <div className="pt-2 space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={handleReset}
                >
                  Reset Current Canvas
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={handleResetAll}
                >
                  Reset All Canvases
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

interface BottomBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function BottomBar({ activeTab, onTabChange }: BottomBarProps) {
  const [activeCanvasName, setActiveCanvasName] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const activeCanvasId = useCanvasStore((state) => state.activeCanvasId);

  useEffect(() => {
    const canvases = loadCanvasesFromStorage();
    if (canvases.length === 0) {
      setActiveCanvasName("Loading...");
      return;
    }

    const activeCanvas = canvases.find((c) => c.id === activeCanvasId);
    if (activeCanvas) {
      setActiveCanvasName(activeCanvas.name);
      setEditedName(activeCanvas.name);
    } else {
      // If we have canvases but none is selected, select the first one
      const firstCanvas = canvases[0];
      setActiveCanvasName(firstCanvas.name);
      setEditedName(firstCanvas.name);
    }
  }, [activeCanvasId]);

  const handleStartEditing = () => {
    if (!activeCanvasId) return;
    setIsEditing(true);
    setEditedName(activeCanvasName);
  };

  const handleSave = () => {
    if (!editedName.trim()) {
      toast.error("Canvas name cannot be empty");
      return;
    }

    const canvases = loadCanvasesFromStorage();
    if (activeCanvasId) {
      const updatedCanvases = canvases.map((canvas) =>
        canvas.id === activeCanvasId
          ? { ...canvas, name: editedName.trim() }
          : canvas
      );
      saveCanvasesToStorage(updatedCanvases);
      setActiveCanvasName(editedName.trim());
      setIsEditing(false);
      toast.success("Canvas renamed successfully");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(activeCanvasName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="flex items-center justify-between px-4 h-12">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 w-48"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSave}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <span
                className={cn(
                  "font-semibold",
                  !activeCanvasId && "text-muted-foreground"
                )}
              >
                {activeCanvasName}
              </span>
              {activeCanvasId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleStartEditing}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
        <CanvasDropdown />
      </div>
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
