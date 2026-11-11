import type { Metadata, Viewport } from "next";
import { Inter, Syne, Unbounded } from "next/font/google";
import "./globals.css";
import { voice } from "@/content/voice";
import { AuthProvider } from "@/hooks/use-auth";
import { SiteShell } from "@/components/layout/SiteShell";
import { Toasts } from "@/components/layout/Toasts";
import { THEME_BOOT_SCRIPT, THEME_COLORS } from "@/lib/theme";

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
  description: voice.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${syne.variable} ${unbounded.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
          <Toasts />
        </AuthProvider>
      </body>
    </html>
  );
}
