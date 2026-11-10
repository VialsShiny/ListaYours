import * as React from "react";
import { cn } from "@/lib/utils";

type SegmentedProps = React.ComponentProps<"nav"> & {
  count: number;
  activeIndex: number;
};

/**
 * Segmented control whose white pill slides under the active item (260ms, drawer curve).
 * Children are the items; the active one must carry `aria-current`.
 */
export function Segmented({
  count,
  activeIndex,
  className,
  style,
  children,
  ...props
}: SegmentedProps) {
  const vars = {
    ...style,
    "--n": count,
    "--active": Math.max(0, activeIndex),
  } as React.CSSProperties;
  return (
    <nav className={cn("segmented segmented-sliding", className)} style={vars} {...props}>
      <span className="segmented-indicator" aria-hidden="true" />
      {children}
    </nav>
  );
}
