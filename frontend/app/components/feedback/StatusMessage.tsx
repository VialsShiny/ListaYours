import { cn } from "@/lib/utils";

type StatusMessageProps = {
  message: string | null | undefined;
  tone?: "info" | "error";
  className?: string;
};

/**
 * Polite live region for async feedback. Always rendered so screen readers pick up changes.
 */
export function StatusMessage({ message, tone = "info", className }: StatusMessageProps) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "text-sm",
        tone === "error" ? "font-medium text-ink" : "text-ink-soft",
        !message && "sr-only",
        className,
      )}
    >
      {message ?? ""}
    </p>
  );
}
