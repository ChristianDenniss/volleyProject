import Link from "next/link";
import { getSessionUser } from "@server/session";
import { isAdmin } from "@server/services/users";

const EXTERNAL_LINKS = [
  { href: "https://discord.gg/volleyball", label: "Roblox Volleyball League" },
  { href: "https://www.roblox.com/games/3840352284/Volleyball-4-2", label: "Play Now" },
];

const LINKS = [
  { href: "/schedules", label: "Schedules" },
  { href: "/stats", label: "Stats" },
  { href: "/games", label: "Games" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/seasons", label: "Seasons" },
  { href: "/records", label: "Records" },
  { href: "/awards", label: "Awards" },
  { href: "/articles", label: "Articles" },
  { href: "/faq", label: "FAQ" },
  { href: "/trivia", label: "Trivia" },
];

const linkClass =
  "block whitespace-nowrap rounded-md px-3 py-2 text-lg font-medium text-white no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:font-semibold hover:text-brand-ink-soft hover:shadow-[0_4px_10px_rgba(0,0,0,0.5)]";

export async function SiteNav() {
  const user = await getSessionUser();

  return (
    <nav className="box-border flex w-full items-center justify-center overflow-x-hidden bg-brand-ink px-5 max-md:h-auto max-md:py-2.5 md:h-[70px]">
      <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-5 p-0 md:gap-[30px]">
        {EXTERNAL_LINKS.map((link) => (
          <li key={link.href} className="flex items-center">
            <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {link.label}
            </a>
          </li>
        ))}
        {LINKS.map((link) => (
          <li key={link.href} className="flex items-center">
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
        {user && isAdmin(user.role) ? (
          <li className="flex items-center">
            <Link href="/portal" className={linkClass}>
              Admin
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
