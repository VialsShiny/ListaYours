import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Page frame: skip link, floating pill navigation, main content and footer.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenu" className="btn btn-primary skip-link">
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
