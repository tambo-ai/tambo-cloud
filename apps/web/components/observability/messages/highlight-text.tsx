import { memo } from "react";

interface HighlightTextProps {
  text: string;
  searchQuery: string;
}

export const HighlightText = memo(
  ({ text, searchQuery }: HighlightTextProps) => {
    if (!searchQuery || !text) return <>{text}</>;

    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));

    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark
              key={index}
              className="bg-yellow-300 text-black px-0.5 rounded"
            >
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </>
    );
  },
);

HighlightText.displayName = "HighlightText";
