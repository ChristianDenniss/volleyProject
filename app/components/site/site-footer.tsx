import Link from "next/link";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/applications", label: "Applications" },
  { href: "/contact", label: "Contact" },
  { href: "/credits", label: "Credits" },
  { href: "/privacy-policy", label: "Privacy policy" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-brand-navy text-white/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-base font-semibold text-white">Volleyball 4-2 League</p>
          <p className="text-sm">Seasons, teams, players and records in one place.</p>
        </div>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
