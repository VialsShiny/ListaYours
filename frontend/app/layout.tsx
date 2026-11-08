import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { SiteShell } from "@/components/layout/SiteShell";
import { cn } from "@/lib/utils";

const manrope = localFont({
  src: [
    { path: "./fonts/manrope-variable-latin.woff2", weight: "400 700", style: "normal" },
    { path: "./fonts/manrope-variable-latin-ext.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
});

const playfair = localFont({
  src: [
    { path: "./fonts/playfair-display-900-latin.woff2", weight: "900", style: "normal" },
    { path: "./fonts/playfair-display-900-latin-ext.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ListaYours.",
    template: "%s — ListaYours.",
  },
  description: "La liste de souhaits à partager : parcourez, réservez, gardez la surprise.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#D9D9DB",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={cn(manrope.variable, playfair.variable)}>
      <body>
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
