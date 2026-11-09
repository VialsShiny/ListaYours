import * as React from "react";
import { cn } from "@/lib/utils";

type MicroLabelProps = React.ComponentProps<"p"> & {
  as?: "p" | "span";
  tone?: "soft" | "accent";
};

/**
 * Uppercase eyebrow label (12–13px, 0.12em tracking) used above titles and for metadata.
 */
export function MicroLabel({ as = "p", tone = "soft", className, ...props }: MicroLabelProps) {
  const Tag = as;
  return (
    <Tag className={cn("eyebrow", tone === "accent" && "eyebrow-accent", className)} {...props} />
  );
}
