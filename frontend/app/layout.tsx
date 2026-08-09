
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
// @ts-ignore: CSS module declarations not available in this environment
import "./globals.css";

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
    <html lang="fr" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}