import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Page frame: skip link, floating pill navigation, main content and footer.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenu"
        className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60]"
      >
        Aller au contenu
      </a>
      <SiteHeader />
      <main id="contenu" className="flex flex-1 flex-col pb-16">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
