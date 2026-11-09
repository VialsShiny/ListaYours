import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("btn [&_svg]:pointer-events-none [&_svg]:shrink-0", {
  variants: {
    variant: {
      primary: "btn-primary",
      secondary: "btn-secondary",
      ghost: "btn-ghost",
      arrow: "btn-arrow",
      icon: "btn-icon",
      "outline-icon": "btn-icon btn-outline-icon",
    },
    block: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    variant: "primary",
    block: false,
  },
});

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, block, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, block }), className)}
      {...props}
    />
  );
});

export { Button, buttonVariants };
export type { ButtonProps };
