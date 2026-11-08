import { Button } from "@/components/ui/button";

type ErrorPanelProps = {
  message: string;
  onRetry?: () => void;
  className?: string;
};

/**
 * Hairline-framed error block with a "Réessayer" button.
 */
export function ErrorPanel({ message, onRetry, className }: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className={`hairline-frame flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between ${className ?? ""}`}
    >
      <div>
        <p className="micro mb-2 text-ink-soft">Erreur</p>
        <p className="text-sm text-ink">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}
