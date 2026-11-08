import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type SlideButtonProps = {
  onClick: () => void;
  label: string;
};

/**
 * 40px circular outlined button that advances a carousel by one card.
 */
export function SlideButton({ onClick, label }: SlideButtonProps) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="micro text-ink-soft" aria-hidden="true">
        Slide
      </span>
      <Button variant="slide" onClick={onClick} aria-label={label}>
        <ArrowRight aria-hidden="true" />
      </Button>
    </span>
  );
}
