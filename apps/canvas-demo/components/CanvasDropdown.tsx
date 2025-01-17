"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Spinner } from "./Spinner";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { STORAGE_KEYS } from "@/types/canvas";
import { loadCanvasesFromStorage } from "@/utils/canvas";
import { useCanvas } from "@/hooks/useCanvas";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { useCanvasSearch } from "@/hooks/useCanvasSearch";
import { useChatStore } from "@/store/chatStore";

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-900">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

interface CanvasListProps {
  canvases: Array<{ id: string; name: string; createdAt: Date }>;
  searchQuery: string;
  onSelect: (canvas: { id: string; name: string; createdAt: Date }) => void;
  onCreateFromSearch: () => void;
}

function CanvasList({
  canvases,
  searchQuery,
  onSelect,
  onCreateFromSearch,
}: CanvasListProps) {
  if (canvases.length === 0) {
    return (
      <div className="space-y-2 py-4">
        <p className="text-sm text-muted-foreground text-center">
          {searchQuery
            ? "No matching canvases found"
            : "Generate your first canvas"}
        </p>
        <Button
          variant={searchQuery ? "secondary" : "default"}
          className="w-full"
          onClick={onCreateFromSearch}
        >
          {searchQuery ? `Create "${searchQuery}"` : "Generate Canvas"}
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-1 max-h-[300px] overflow-y-auto">
      {canvases.map((canvas) => (
        <li key={canvas.id}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sm px-3 py-2 h-auto",
              "hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => onSelect(canvas)}
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="font-medium">
                <HighlightedText text={canvas.name} query={searchQuery} />
              </span>
              <span className="text-xs text-muted-foreground">
                Created {canvas.createdAt.toLocaleDateString()}
              </span>
            </div>
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function CanvasDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [canvases, setCanvases] = useState<
    Array<{ id: string; name: string; createdAt: Date }>
  >([]);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [hasShownTip, setHasShownTip] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const { switchCanvas, createNewCanvas } = useCanvas();
  const { searchQuery, setSearchQuery, filteredCanvases, isLoading } =
    useCanvasSearch(canvases);
  const { setActiveCanvas: setChatCanvas } = useChatStore();

  useKeyboardShortcut(
    "t",
    () => {
      setIsOpen(true);
      setTimeout(() => {
        const searchInput = document.querySelector(
          '[placeholder="Search canvases..."]'
        ) as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }, 0);
    },
    { ctrl: true }
  );

  useEffect(() => {
    // Initialize canvas on mount
    const loadedCanvases = loadCanvasesFromStorage();

    if (loadedCanvases.length === 0) {
      // Create first canvas if none exist
      const { updatedCanvases } = createNewCanvas("My First Canvas", []);
      setCanvases(updatedCanvases);

      // First canvas will be automatically set as active by createNewCanvas
    } else {
      setCanvases(loadedCanvases);
      // Initialize with last canvas
      const lastCanvas = loadedCanvases[loadedCanvases.length - 1];
      if (lastCanvas) {
        switchCanvas(lastCanvas.id);
        setChatCanvas(lastCanvas.id);
      }
    }
  }, [switchCanvas, setChatCanvas, createNewCanvas]);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  const handleCreateCanvas = useCallback(
    (name: string = newCanvasName) => {
      const canvasName = name.trim() || `Canvas ${canvases.length + 1}`;
      const { updatedCanvases } = createNewCanvas(canvasName, canvases);
      setCanvases(updatedCanvases);
      setNewCanvasName("");
      setIsOpen(false);
    },
    [canvases, createNewCanvas, newCanvasName]
  );

  const handleSelectCanvas = useCallback(
    (canvas: { id: string }) => {
      switchCanvas(canvas.id);
      setChatCanvas(canvas.id); // Also update chat store
      setIsOpen(false);
    },
    [switchCanvas, setChatCanvas]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open && !hasShownTip) {
        toast.info(
          <div className="flex items-center gap-1">
            <Command className="h-4 w-4" />
            <span>
              Pro tip: Press {isMac ? "⌘" : "Ctrl"}+T to quickly open the canvas
              switcher
            </span>
          </div>,
          { duration: 4000 }
        );
        setHasShownTip(true);
        localStorage.setItem(STORAGE_KEYS.CANVAS_TIP, "true");
      }
    },
    [hasShownTip, isMac]
  );

  useEffect(() => {
    const hasShownBefore = localStorage.getItem(STORAGE_KEYS.CANVAS_TIP);
    if (hasShownBefore) setHasShownTip(true);
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Plus className="h-4 w-4" />
          <span className="sr-only">New Canvas</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">{isMac ? "⌘" : "Ctrl"}</span>T
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-4" side="bottom" align="start">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search canvases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Your Canvases</h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-20">
                <Spinner />
              </div>
            ) : (
              <CanvasList
                canvases={filteredCanvases}
                searchQuery={searchQuery}
                onSelect={handleSelectCanvas}
                onCreateFromSearch={() => {
                  if (searchQuery) {
                    setNewCanvasName(searchQuery);
                    handleCreateCanvas(searchQuery);
                  } else {
                    handleCreateCanvas();
                  }
                }}
              />
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
