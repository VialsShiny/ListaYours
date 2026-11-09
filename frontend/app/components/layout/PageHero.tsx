import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  size?: "hero" | "section";
  titleId?: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Rounded cherry-to-jet gradient block that opens every page.
 */
export function PageHero({
  eyebrow,
  title,
  size = "section",
  titleId,
  className,
  children,
}: PageHeroProps) {
  return (
    <header className="container pt-4 md:pt-6">
      <div className={cn("hero", size === "section" && "py-10 md:py-12", className)}>
        <MicroLabel>{eyebrow}</MicroLabel>
        <DisplayTitle size={size} id={titleId} className={cn(size === "section" ? "mt-3" : "mt-6")}>
          {title}
        </DisplayTitle>
        {children}
      </div>
    </header>
  );
}
