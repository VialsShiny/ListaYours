import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorPanelProps = {
  message: string;
  title?: string;
  onRetry?: () => void;
  className?: string;
};

/**
 * Error block with a 1.5px accent border and a "Réessayer" button.
 */
export function ErrorPanel({
  message,
  title = "Quelque chose n'a pas fonctionné",
  onRetry,
  className,
}: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className={cn("panel panel-error flex flex-col items-start gap-3 p-7", className)}
    >
      <DisplayTitle as="p" size="sub">
        {title}
      </DisplayTitle>
      <p className="text-secondary max-w-prose text-soft">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-1" onClick={onRetry}>
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}
