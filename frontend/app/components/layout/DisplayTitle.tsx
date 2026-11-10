import * as React from "react";
import { cn } from "@/lib/utils";

type DisplayTitleProps = React.ComponentProps<"h1"> & {
  as?: "h1" | "h2" | "h3" | "p";
  size?: "hero" | "section" | "sub" | "card";
  period?: boolean;
};

const sizes = {
  hero: "display display-hero",
  section: "display display-section",
  sub: "display display-sub",
  card: "display-card",
};

/**
 * Display heading in the title typeface, ending with the accent-coloured period by default.
 */
export function DisplayTitle({
  as = "h1",
  size = "section",
  period = true,
  className,
  children,
  ...props
}: DisplayTitleProps) {
  const Tag = as;
  return (
    <Tag className={cn(sizes[size], className)} {...props}>
      {children}
      {period ? (
        <span className="period" aria-hidden="true">
          {"\u2060."}
        </span>
      ) : null}
    </Tag>
  );
}
