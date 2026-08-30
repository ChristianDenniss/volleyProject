/**
 * SiteFooter — the bottom bar of the public site: the league mark, the secondary link row (Home / Discord / Game / About / Privacy / Contact / Credits), the social icons, and the copyright line.
 * Links are declared as two module-scope arrays rather than repeated markup, so adding a destination is one entry — the layout doesn't change.
 * Lives in `components/layout/`; rendered once by App below the routed content, never by a page.
 */
import { Link } from 'react-router-dom'
import { FaYoutube, FaTwitter } from 'react-icons/fa'
import { FaDiscord } from 'react-icons/fa6'
import rvlLogo from '@/images/rvlLogo.png'

interface FooterLink {
  label: string
  to: string
  external?: boolean
}

const FOOTER_LINKS: FooterLink[] = [
  { label: 'Home', to: '/' },
  { label: 'RVL', to: 'https://discord.gg/volleyball', external: true },
  { label: 'Game', to: 'https://www.roblox.com/games/3840352284/Volleyball-4-2', external: true },
  { label: 'About', to: '/about' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'Credits', to: '/credits' },
]

const SOCIAL_LINKS = [
  { label: 'YouTube', href: 'https://www.youtube.com/@RobloxVolleyballLeague', icon: <FaYoutube /> },
  { label: 'Discord', href: 'https://discord.gg/volleyball', icon: <FaDiscord /> },
  { label: 'Twitter', href: 'https://twitter.com', icon: <FaTwitter /> },
]

const LINK_CLASSES =
  'text-content-inverse no-underline transition-colors hover:text-brand-muted'

export default function SiteFooter() {
  return (
    <footer className="w-full shrink-0 bg-surface-inverse py-5 text-content-inverse">
      <div className="flex flex-wrap items-center justify-between gap-6 px-8">
        <div className="shrink-0">
          <img src={rvlLogo} alt="Roblox Volleyball League" className="h-[75px] w-auto" />
        </div>

        <nav className="flex flex-wrap justify-center gap-8 text-[1.1rem] font-medium">
          {FOOTER_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.to}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASSES}
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.label} to={link.to} className={LINK_CLASSES}>
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex gap-6 text-[1.3rem]">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className={`${LINK_CLASSES} transition-transform hover:scale-125`}
            >
              {social.icon}
            </a>
          ))}
        </div>
      </div>

      <hr className="mx-8 my-4 border-0 border-t border-brand-muted" />

      <div className="pb-2.5 text-center text-sm">
        <p className="m-0">
          Copyright (C) {new Date().getFullYear()} Volleyball World | All Rights Reserved
        </p>
      </div>
    </footer>
  )
}
