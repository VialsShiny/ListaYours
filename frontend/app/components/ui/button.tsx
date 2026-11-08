import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border transition-colors duration-200 select-none disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "micro rounded-[2px] border-ink bg-ink px-5 py-3 text-white hover:bg-ink/85",
        outline:
          "micro rounded-[2px] border-ink bg-transparent px-5 py-3 text-ink hover:bg-ink hover:text-white",
        ghost:
          "micro border-transparent px-2 py-2 text-ink underline decoration-1 underline-offset-4 hover:text-ink-soft",
        square: "size-11 border-ink bg-ink text-white hover:bg-ink/85 [&_svg]:size-5",
        slide:
          "size-10 rounded-full border-ink bg-transparent text-ink hover:bg-ink hover:text-white [&_svg]:size-4",
        icon: "size-9 border-transparent bg-transparent text-ink hover:bg-surface-alt [&_svg]:size-4",
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
  },
);

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
