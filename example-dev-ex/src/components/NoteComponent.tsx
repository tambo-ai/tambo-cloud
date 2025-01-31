import { type ReactElement } from "react";

interface NoteProps {
  title: string;
  content: string;
  tags?: string[];
}

export const NoteComponent = ({
  title,
  content,
  tags = [],
}: Readonly<NoteProps>): ReactElement => {
  return (
    <div>
      <input value={title} readOnly />
      <textarea value={content} readOnly></textarea>
      <div>
        {tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
};
