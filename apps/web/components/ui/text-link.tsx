import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
}

const TextLink = React.forwardRef<HTMLAnchorElement, TextLinkProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          "text-primary-dark hover:underline font-medium",
          className,
        )}
        {...props}
      >
        {children}
      </a>
    );
  },
);
TextLink.displayName = "TextLink";

export { TextLink };
