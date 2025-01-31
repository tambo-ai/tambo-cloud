import { type ReactElement } from "react";
import { type NoteData } from "../schemas/componentSchemas";

interface NoteProps {
  title: string;
  content: string;
  tags?: string[];
  onUpdate?: (update: Partial<NoteData>) => void;
}

export const NoteComponent = ({
  title,
  content,
  tags = [],
  onUpdate,
}: Readonly<NoteProps>): ReactElement => {
  return (
    <div>
      <input
        value={title}
        onChange={(e) => onUpdate?.({ title: e.target.value })}
      />
      <textarea
        value={content}
        onChange={(e) => onUpdate?.({ content: e.target.value })}
      />
      <div>
        {tags.map((tag) => (
          <span key={tag}>
            {tag}
            <button
              onClick={() =>
                onUpdate?.({
                  tags: tags.filter((t) => t !== tag),
                })
              }
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};
