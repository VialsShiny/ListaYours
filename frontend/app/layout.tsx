import type { Metadata, Viewport } from "next";
import { Inter, Syne, Unbounded } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { SiteShell } from "@/components/layout/SiteShell";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "800"],
  variable: "--font-syne",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-unbounded",
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
  viewportFit: "cover",
  themeColor: "#fafafa",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${syne.variable} ${unbounded.variable}`}>
      <body>
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
