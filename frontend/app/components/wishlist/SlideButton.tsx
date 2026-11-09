import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type SlideButtonProps = {
  onClick: () => void;
  label: string;
};

/**
 * 44px circular button that advances a carousel by one card.
 */
export function SlideButton({ onClick, label }: SlideButtonProps) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="eyebrow" aria-hidden="true">
        Suivant
      </span>
      <Button variant="icon" onClick={onClick} aria-label={label}>
        <ArrowRight aria-hidden="true" />
      </Button>
    </span>
  );
}
