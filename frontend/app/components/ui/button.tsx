import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("btn [&_svg]:pointer-events-none [&_svg]:shrink-0", {
  variants: {
    variant: {
      primary: "btn-primary",
      secondary: "btn-secondary",
      destructive: "btn-destructive",
      "destructive-fill": "btn-destructive-fill",
      muted: "btn-muted",
      ghost: "btn-ghost",
      text: "btn-text",
      "text-accent": "btn-text btn-text-accent",
      icon: "btn-icon",
      "icon-lg": "btn-icon btn-icon-lg",
    },
    size: {
      md: "",
      sm: "btn-sm",
      hero: "btn-hero",
    },
    block: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    block: false,
  },
});

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
});

export { Button, buttonVariants };
export type { ButtonProps };
