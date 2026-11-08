import Link from "next/link";
import { cn } from "@/lib/utils";

type NoticeProps = {
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
};

/**
 * Hairline notice: a sentence between two 1px rules, optionally followed by an arrow link.
 */
export function Notice({ children, href, linkLabel, className }: NoticeProps) {
  return (
    <div className={cn("hairline border-b border-b-line py-4 text-sm", className)}>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span>{children}</span>
        {href && linkLabel ? (
          <Link href={href} className="link-arrow font-medium text-ink">
            {linkLabel}
          </Link>
        ) : null}
      </p>
    </div>
  );
}
