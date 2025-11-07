"use client";

import { cn } from "@/lib/utils";
import { NodeViewWrapper } from "@tiptap/react";
import { Cuboid } from "lucide-react";
import PropTypes from "prop-types";

export interface MentionNodeViewProps {
  node: {
    attrs: {
      id: string;
      label: string;
    };
  };
  selected: boolean;
}

/**
 * Custom React component for rendering mention nodes as inline badges
 * This creates the styled pill/chip that appears in the editor
 */
export const TiptapMentionNode: React.FC<MentionNodeViewProps> = ({
  node,
  selected,
}) => {
  return (
    <NodeViewWrapper
      as="span"
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 mx-0.5",
        "rounded-md text-xs font-medium",
        "bg-primary/10 text-primary",
        "border border-primary/20",
        selected && "ring-2 ring-primary/50",
      )}
    >
      <Cuboid className="w-3 h-3 flex-shrink-0" />
      <span>{node.attrs.label}</span>
    </NodeViewWrapper>
  );
};

TiptapMentionNode.propTypes = {
  node: PropTypes.shape({
    attrs: PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  selected: PropTypes.bool.isRequired,
};
