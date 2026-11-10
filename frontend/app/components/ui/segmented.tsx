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
export function Segmented({ count, activeIndex, className, children, ...props }: SegmentedProps) {
  const style = { "--n": count, "--active": Math.max(0, activeIndex) } as React.CSSProperties;
  return (
    <nav className={cn("segmented segmented-sliding", className)} style={style} {...props}>
      <span className="segmented-indicator" aria-hidden="true" />
      {children}
    </nav>
  );
}
