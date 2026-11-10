import Link from "next/link";
import { cn } from "@/lib/utils";

type NoticeProps = {
  children: React.ReactNode;
  title?: string;
  tone?: "info" | "success" | "error";
  href?: string;
  linkLabel?: string;
  className?: string;
};

const ICONS = { info: "i", success: "✓", error: "!" };

/**
 * Flat tile notice with a round marker: a sentence, optionally a title and a link.
 */
export function Notice({
  children,
  title,
  tone = "info",
  href,
  linkLabel,
  className,
}: NoticeProps) {
  return (
    <div
      className={cn(
        "notice",
        tone === "success" && "notice-card",
        tone === "error" && "notice-error",
        className,
      )}
      role={tone === "error" ? "alert" : undefined}
    >
      <span className="notice-dot" aria-hidden="true">
        {ICONS[tone]}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        {title ? <p className="text-[16px] font-semibold">{title}</p> : null}
        <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", title && "text-soft")}>
          <span>{children}</span>
          {href && linkLabel ? (
            <Link href={href} className="text-link">
              {linkLabel}
            </Link>
          ) : null}
        </p>
      </div>
    </div>
  );
}
