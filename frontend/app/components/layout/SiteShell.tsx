import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * The page backdrop and the single large light card that holds every page.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg px-4 py-4 md:px-8 md:py-8">
      <a
        href="#contenu"
        className="micro sr-only bg-ink text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2"
      >
        Aller au contenu
      </a>
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1400px] flex-col overflow-hidden rounded-[24px] bg-surface shadow-card md:min-h-[calc(100vh-4rem)]">
        <SiteHeader />
        <main id="contenu" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
