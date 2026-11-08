import * as React from "react";
import { cn } from "@/lib/utils";

type DisplayTitleProps = React.ComponentProps<"h1"> & {
  as?: "h1" | "h2" | "h3";
  size?: "hero" | "section" | "card";
};

/**
 * Playfair Display 900 headline. The closing period is part of the brand: pass text without it.
 */
export function DisplayTitle({
  as = "h1",
  size = "section",
  className,
  children,
  ...props
}: DisplayTitleProps) {
  const Tag = as;
  return (
    <Tag className={cn("display", `display-${size}`, className)} {...props}>
      {children}.
    </Tag>
  );
}
