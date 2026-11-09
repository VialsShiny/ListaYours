import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorPanelProps = {
  message: string;
  onRetry?: () => void;
  className?: string;
};

/**
 * Error block with a "Réessayer" button.
 */
export function ErrorPanel({ message, onRetry, className }: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className={cn(
        "panel flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div>
        <p className="eyebrow mb-2 text-accent">Erreur</p>
        <p className="text-secondary text-ink">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}
