import Link from "next/link";

const NAV = [
  { href: "/", label: "Home", external: false },
  { href: "https://discord.gg/volleyball", label: "RVL", external: true },
  {
    href: "https://www.roblox.com/games/3840352284/Volleyball-4-2",
    label: "Game",
    external: true,
  },
  { href: "/about", label: "About", external: false },
  { href: "/privacy-policy", label: "Privacy Policy", external: false },
  { href: "/contact", label: "Contact Us", external: false },
  { href: "/credits", label: "Credits", external: false },
];

const SOCIALS = [
  {
    href: "https://www.youtube.com/@RobloxVolleyballLeague",
    label: "YouTube",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    href: "https://discord.gg/volleyball",
    label: "Discord",
    path: "M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z",
  },
  {
    href: "https://twitter.com",
    label: "Twitter",
    path: "M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 0 0-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 0 0-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 0 1-2.228-.616v.06a4.923 4.923 0 0 0 3.946 4.827 4.996 4.996 0 0 1-2.212.085 4.936 4.936 0 0 0 4.604 3.417 9.867 9.867 0 0 1-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0 0 7.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0 0 24 4.59z",
  },
];

export function SiteFooter() {
  return (
    <footer className="w-full shrink-0 border-t border-rvl-line bg-rvl-panel text-rvl-ink">
      <div className="flex flex-col gap-10 px-5 py-12 sm:px-8 xl:px-14">
        <div className="flex flex-col gap-8 md:grid md:grid-cols-[210px_1fr] md:gap-14">
          <div className="flex flex-col gap-4">
            <img src="/rvlLogo.png" alt="RVL Logo" className="h-14 w-auto self-start" />
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rvl-dim">
              Roblox Volleyball League
            </span>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <nav className="flex flex-wrap gap-x-8 gap-y-3">
              {NAV.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:text-rvl-accent"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:text-rvl-accent"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </nav>

            <div className="flex gap-5">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-rvl-dim transition-colors hover:text-rvl-accent"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="size-[1.15rem]"
                  >
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-rvl-line pt-6">
          <p className="m-0 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-rvl-dim">
            Copyright (C) {new Date().getFullYear()} Volleyball World · All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
