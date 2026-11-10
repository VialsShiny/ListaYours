import Link from "next/link";
import { Segmented } from "@/components/ui/segmented";
import type { ViewMode } from "@/hooks/use-view-mode";

type ViewSwitchProps = {
  view: ViewMode;
  hrefFor: (mode: ViewMode) => string;
  onSelect: (mode: ViewMode) => void;
  className?: string;
};

const OPTIONS: Array<{ mode: ViewMode; label: string }> = [
  { mode: "naviguer", label: "Naviguer" },
  { mode: "grille", label: "Grille" },
];

/**
 * Naviguer / Grille switch. Plain links keep it server-renderable; a click hands over to
 * `onSelect`, which swaps the view under a View Transition and updates the URL.
 */
export function ViewSwitch({ view, hrefFor, onSelect, className }: ViewSwitchProps) {
  const activeIndex = OPTIONS.findIndex((option) => option.mode === view);
  return (
    <Segmented
      aria-label="Affichage de la liste"
      count={OPTIONS.length}
      activeIndex={activeIndex}
      className={className}
    >
      {OPTIONS.map((option) => (
        <Link
          key={option.mode}
          href={hrefFor(option.mode)}
          replace
          scroll={false}
          aria-current={view === option.mode ? "page" : undefined}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onSelect(option.mode);
          }}
        >
          {option.label}
        </Link>
      ))}
    </Segmented>
  );
}
