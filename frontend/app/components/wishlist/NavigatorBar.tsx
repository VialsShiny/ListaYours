import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPosition } from "@/lib/wishlist-navigation";

type NavigatorBarProps = {
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onShowCategory?: () => void;
  action?: React.ReactNode;
};

/**
 * Counter "01 / 23" (polite live region), category shortcut, previous/next and the main action,
 * followed by a thin progress line whose accent segment scales over 220ms.
 */
export function NavigatorBar({
  index,
  total,
  isFirst,
  isLast,
  onPrevious,
  onNext,
  onShowCategory,
  action,
}: NavigatorBarProps) {
  const progress = total > 0 ? (index + 1) / total : 0;
  return (
    <>
      <div className="navigator-bar">
        <Button
          variant="icon"
          className="btn-icon-lg lg:btn-icon"
          aria-label="Cadeau précédent"
          disabled={isFirst}
          onClick={onPrevious}
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <p className="navigator-counter" aria-live="polite" aria-atomic="true">
          <b>{formatPosition(index)}</b>
          <span className="text-soft"> / {formatPosition(total - 1)}</span>
        </p>
        <Button
          variant="icon"
          className="btn-icon-lg lg:btn-icon"
          aria-label="Cadeau suivant"
          disabled={isLast}
          onClick={onNext}
        >
          <ArrowRight aria-hidden="true" />
        </Button>
        {onShowCategory ? (
          <Button variant="secondary" size="sm" className="max-lg:hidden" onClick={onShowCategory}>
            Voir la catégorie
          </Button>
        ) : null}
        <span className="flex-1 max-lg:hidden" />
        {action ? <div className="max-lg:hidden">{action}</div> : null}
      </div>
      <div className="navigator-progress">
        <div className="progress-line" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
        <p className="text-small mt-3 text-soft max-lg:hidden">
          Astuce : les flèches ← → du clavier changent de cadeau, ou faites glisser l&apos;image.
        </p>
      </div>
    </>
  );
}
