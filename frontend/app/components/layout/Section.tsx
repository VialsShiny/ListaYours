import * as React from "react";
import { cn } from "@/lib/utils";

type SectionProps = React.ComponentProps<"section"> & { tone?: "white" | "band" | "surface" };

const tones = {
  white: "bg-white",
  band: "bg-surface-alt",
  surface: "bg-surface",
};

/**
 * Full-width page section with the shared horizontal gutters (16px on phones).
 */
export function Section({ tone = "white", className, children, ...props }: SectionProps) {
  return (
    <section
      className={cn(tones[tone], "px-4 py-12 md:px-12 md:py-16 lg:px-16", className)}
      {...props}
    >
      {children}
    </section>
  );
}
