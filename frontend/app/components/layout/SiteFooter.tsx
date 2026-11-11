import Link from "next/link";
import { voice } from "@/content/voice";
import { MicroLabel } from "@/components/layout/MicroLabel";

export function SiteFooter() {
  const columns = [
    {
      title: voice.footer.here,
      links: [
        { href: "/", label: voice.footer.home },
        { href: "/#comment-ca-se-passe", label: voice.nav.how },
      ],
    },
    {
      title: voice.footer.you,
      links: [
        { href: "/connexion", label: voice.nav.login },
        { href: "/inscription", label: voice.nav.register },
      ],
    },
  ];

  return (
    <footer className="container mt-auto pt-12 pb-10">
      <div className="hairline flex flex-col gap-8 pt-8 md:flex-row md:justify-between">
        <div className="flex max-w-xs flex-col gap-3">
          <p className="wordmark">{voice.brand}</p>
          <p className="text-secondary text-soft">{voice.footer.line}</p>
        </div>
        <div className="flex gap-16 text-secondary">
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-2.5">
              <MicroLabel as="p">{column.title}</MicroLabel>
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-11 items-center"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="text-small mt-10 text-soft">{voice.footer.signature}</p>
    </footer>
  );
}
