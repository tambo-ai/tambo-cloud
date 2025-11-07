"use client";

import { cn } from "@/lib/utils";
import { Cuboid } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type ForwardedRef,
} from "react";

export interface SuggestionItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  componentData?: unknown;
}

export interface MentionSuggestionListProps {
  items: SuggestionItem[];
  command: (item: SuggestionItem) => void;
}

export interface SuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

/**
 * Dropdown list component for rendering mention suggestions
 * Handles keyboard navigation (up/down arrows, enter, escape)
 */
export const MentionSuggestionList = forwardRef<
  SuggestionListRef,
  MentionSuggestionListProps
>((props, ref: ForwardedRef<SuggestionListRef>) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length,
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  if (props.items.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        No results found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 p-1">
      {props.items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left",
            "hover:bg-accent hover:text-accent-foreground",
            "transition-colors cursor-pointer",
            index === selectedIndex && "bg-accent text-accent-foreground",
          )}
          onClick={() => selectItem(index)}
        >
          {item.icon ?? <Cuboid className="w-4 h-4 flex-shrink-0" />}
          <span className="truncate">{item.name}</span>
        </button>
      ))}
    </div>
  );
});

MentionSuggestionList.displayName = "MentionSuggestionList";
