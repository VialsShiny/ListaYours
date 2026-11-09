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
        "text-subhead",
        tone === "error" ? "font-semibold text-accent-text" : "text-ink-soft",
        !message && "sr-only",
        className,
      )}
    >
      {tone === "error" && message ? <span aria-hidden="true">⚠ </span> : null}
      {message ?? ""}
    </p>
  );
}
