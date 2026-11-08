import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 11px uppercase label with wide tracking, used for navigation and metadata.
 */
export function MicroLabel({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("micro text-ink-soft", className)} {...props} />;
}
