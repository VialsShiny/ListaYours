import Link from "next/link";
import type { ViewMode } from "@/hooks/use-view-mode";
import { cn } from "@/lib/utils";

type ViewSwitchProps = {
  view: ViewMode;
  hrefFor: (mode: ViewMode) => string;
  className?: string;
};

const OPTIONS: Array<{ mode: ViewMode; label: string }> = [
  { mode: "naviguer", label: "Naviguer" },
  { mode: "grille", label: "Grille" },
];

/**
 * Segmented control between the two list views. Plain links keep it server-renderable.
 */
export function ViewSwitch({ view, hrefFor, className }: ViewSwitchProps) {
  return (
    <nav aria-label="Affichage de la liste" className={cn("segmented", className)}>
      {OPTIONS.map((option) => (
        <Link
          key={option.mode}
          href={hrefFor(option.mode)}
          replace
          scroll={false}
          aria-current={view === option.mode ? "true" : undefined}
          className="flex-1"
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
