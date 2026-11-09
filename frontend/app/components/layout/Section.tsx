import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Vertical rhythm block (64px on desktop, 48px on phones) with the centred 1200px container.
 */
export function Section({ className, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section className={cn("section", className)} {...props}>
      <div className="container">{children}</div>
    </section>
  );
}
