import * as React from "react";
import { cn } from "@/lib/utils";

type DisplayTitleProps = React.ComponentProps<"h1"> & {
  as?: "h1" | "h2" | "h3";
  size?: "hero" | "section" | "card";
};

const sizes = {
  hero: "display display-hero",
  section: "display display-section",
  card: "display-card",
};

/**
 * Display heading in the title typeface; `hero` is the ultra-wide uppercase style.
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
    <Tag className={cn(sizes[size], className)} {...props}>
      {children}
    </Tag>
  );
}
