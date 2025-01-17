import { useState, useMemo } from "react";
import { filterAndSortCanvases } from "@/utils/canvas";
import type { Canvas } from "@/types/canvas";

export function useCanvasSearch(canvases: Canvas[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredCanvases = useMemo(() => {
    setIsLoading(true);
    const filtered = filterAndSortCanvases(canvases, searchQuery);
    setIsLoading(false);
    return filtered;
  }, [searchQuery, canvases]);

  return {
    searchQuery,
    setSearchQuery,
    filteredCanvases,
    isLoading,
  };
}
