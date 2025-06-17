import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

// Convert a string to Title Case
function toTitleCase(input: string): string {
  return input.replace(/\w\S*/g, (txt) => txt[0].toUpperCase() + txt.slice(1));
}

// Define the variant type explicitly
type ButtonVariantType =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "orange"
  | "accent";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80 hover:scale-105",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:border-pink-500 hover:text-pink-500",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary-foreground underline-offset-4 hover:underline",
        orange:
          "border border-input hover:bg-accent hover:text-accent-foreground",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariant = ButtonVariantType;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "variant"> {
  asChild?: boolean;
  variant?: ButtonVariant;
  /** Icon shown before the label */
  Icon?: React.ElementType;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      Icon,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = cn(
      buttonVariants({
        variant: variant as ButtonVariantType,
        size,
        className,
      }),
    );

    const iconNode =
      Icon != null ? <Icon className="mr-2 h-4 w-4" aria-hidden="true" /> : null;

    // If `asChild` is true, clone the provided element (e.g., Next.js `Link`)
    // so we can merge classes/props and inject the icon + formatted label.
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, {
        ...props,
        className: cn(classes, (children.props as { className?: string }).className),
        children: (
          <>
            {iconNode}
            {typeof children.props.children === "string"
              ? toTitleCase(children.props.children)
              : children.props.children}
          </>
        ),
      });
    }

    const Comp = asChild ? Slot : "button";

    return (
      <Comp className={classes} ref={ref} {...props}>
        {iconNode}
        {typeof children === "string" ? toTitleCase(children) : children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
