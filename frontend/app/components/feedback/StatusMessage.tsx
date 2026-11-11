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
        "text-secondary flex items-center gap-2",
        tone === "error" ? "font-semibold text-accent" : "text-soft",
        !message && "sr-only",
        className,
      )}
    >
      {message ? (
        <span
          aria-hidden="true"
          className={cn(
            "inline-grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
            tone === "error" ? "bg-accent text-on-accent" : "bg-ink text-on-ink",
          )}
        >
          {tone === "error" ? "!" : "✓"}
        </span>
      ) : null}
      {message ?? ""}
    </p>
  );
}
