import { useHydraComponentState } from "hydra-ai-react";
import { type ReactElement } from "react";

// Base component interface
interface NoteProps {
  title: string;
  content: string;
  tags: string[];
  onTitleChange?: (title: string) => void;
  onContentChange?: (content: string) => void;
  onTagsChange?: (tags: string[]) => void;
}

// Base component is Hydra-agnostic
export const NoteComponent = ({
  title,
  content,
  tags,
  onTitleChange,
  onContentChange,
  onTagsChange,
}: Readonly<NoteProps>): ReactElement => {
  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange?.(e.target.value)}
      />
      <textarea
        value={content}
        onChange={(e) => onContentChange?.(e.target.value)}
      />
      <div>
        {tags.map((tag, index) => (
          <span key={index}>{tag}</span>
        ))}
      </div>
    </div>
  );
};

// Hydra wrapper component
export const HydraNoteComponent = ({
  messageId,
}: {
  messageId: string;
}): ReactElement => {
  const { interactiveProps, updateInteractiveProps } =
    useHydraComponentState<NoteProps>(messageId);

  return (
    <NoteComponent
      {...interactiveProps}
      onTitleChange={(title) => updateInteractiveProps({ title })}
      onContentChange={(content) => updateInteractiveProps({ content })}
      onTagsChange={(tags) => updateInteractiveProps({ tags })}
    />
  );
};
