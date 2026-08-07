import type { Metadata } from "next";
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
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", backgroundColor: "#f9fafb" }}>
        {children}
      </body>
    </html>
  );
}