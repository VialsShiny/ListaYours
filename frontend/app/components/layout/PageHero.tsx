import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  titleId?: string;
  period?: boolean;
  aside?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Page opening: eyebrow, huge display title with the accent period, optional right-hand aside.
 */
export function PageHero({
  eyebrow,
  title,
  titleId,
  period = true,
  aside,
  className,
  children,
}: PageHeroProps) {
  return (
    <header className={cn("container pt-8 md:pt-14", className)}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-5">
          <MicroLabel>{eyebrow}</MicroLabel>
          <DisplayTitle size="hero" id={titleId} period={period}>
            {title}
          </DisplayTitle>
        </div>
        {aside ? <div className="flex min-w-0 flex-col items-end gap-3 pb-2">{aside}</div> : null}
      </div>
      {children}
    </header>
  );
}
