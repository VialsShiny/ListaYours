
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
// @ts-ignore: CSS module declarations not available in this environment
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "ListaYours - Scraper E-commerce",
  description: "Plateforme d'extraction de données de produits e-commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={cn("scroll-smooth", "font-sans", inter.variable)}>
      <body className="min-h-screen py-6 md:py-12 bg-slate-50 font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}