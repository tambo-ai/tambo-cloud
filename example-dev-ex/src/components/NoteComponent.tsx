import { type ReactElement } from "react";

type NoteProps = Readonly<{
  title: string;
  content: string;
  tags?: string[];
  onChange?: (updates: Partial<NoteProps>) => void;
}>;

export const NoteComponent = ({
  title,
  content,
  tags = [],
  onChange,
}: NoteProps): ReactElement => {
  const isEditable = !!onChange;

  return (
    <div>
      <input
        value={title}
        readOnly={!isEditable}
        onChange={
          isEditable ? (e) => onChange({ title: e.target.value }) : undefined
        }
      />
      <textarea
        value={content}
        readOnly={!isEditable}
        onChange={
          isEditable ? (e) => onChange({ content: e.target.value }) : undefined
        }
      />
      <div>
        {tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
};
