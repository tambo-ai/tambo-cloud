import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useChatStore } from "@/store/chatStore";

const suggestions = [
  "Show me GDP growth over the last 10 years",
  "Compare inflation rate vs unemployment rate",
  "Display consumer price index trends",
  "Show me industrial production data",
  "Graph personal savings rate changes",
  "Compare housing starts vs home prices",
  "Show me retail sales trends",
  "Display federal funds rate history",
];

export function ChatSuggestions() {
  const setInput = useChatStore((state) => state.setInput);
  const isLoading = useChatStore((state) => state.isLoading);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      handleScroll(); // Check initial state
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="border-t bg-background py-4">
      <div className="relative flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          className={`absolute left-0 z-10 h-8 w-8 bg-gradient-to-r from-background via-background/95 to-transparent transition-opacity duration-200 ${
            showLeftArrow ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => scroll("left")}
          aria-hidden={!showLeftArrow}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-8"
          role="listbox"
          aria-label="Chat suggestions"
        >
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => setInput(suggestion)}
              disabled={isLoading}
              className="whitespace-nowrap bg-background hover:bg-accent hover:text-accent-foreground active:scale-95 transition-all"
              role="option"
            >
              {suggestion}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={`absolute right-0 z-10 h-8 w-8 bg-gradient-to-l from-background via-background/95 to-transparent transition-opacity duration-200 ${
            showRightArrow ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => scroll("right")}
          aria-hidden={!showRightArrow}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
