import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Uppercase eyebrow label used above titles and for metadata.
 */
export function MicroLabel({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("eyebrow", className)} {...props} />;
}
