import Link from "next/link";
import { cn } from "@/lib/utils";

type NoticeProps = {
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
};

/**
 * Soft notice panel: a sentence, optionally followed by a link.
 */
export function Notice({ children, href, linkLabel, className }: NoticeProps) {
  return (
    <div className={cn("panel text-subhead bg-surface-2 px-5 py-4", className)}>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span>{children}</span>
        {href && linkLabel ? (
          <Link href={href} className="text-link">
            {linkLabel}
          </Link>
        ) : null}
      </p>
    </div>
  );
}
