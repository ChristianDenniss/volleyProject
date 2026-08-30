/**
 * SiteNav — the dark primary navigation bar under the site header, listing every top-level destination plus the two external links (Discord, the Roblox game).
 * Destinations are declared once in the `NAV_ITEMS` array — including the admin-only Portal entry, gated by a `roles` field — so adding a page is a single line and the markup never repeats.
 * Lives in `components/layout/`; rendered once by App, and scales its type and gaps across the `vp-mobile` / `vp-wide` tiers.
 */
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/authContext'

interface NavItem {
  label: string
  to: string
  external?: boolean
  /** When set, the item only renders for a signed-in user holding one of these roles. */
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Join Discord', to: 'https://discord.gg/volleyball', external: true },
  { label: 'Play Now', to: 'https://www.roblox.com/games/3840352284/Volleyball-4-2', external: true },
  { label: 'Schedules', to: '/schedules' },
  { label: 'Stats', to: '/stats' },
  { label: 'Games', to: '/games' },
  { label: 'Teams', to: '/teams' },
  { label: 'Players', to: '/players' },
  { label: 'Seasons', to: '/seasons' },
  { label: 'Articles', to: '/articles' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Trivia', to: '/trivia' },
  { label: 'Admin', to: '/portal', roles: ['admin', 'superadmin'] },
]

const LINK_CLASSES =
  'block whitespace-nowrap rounded-control px-3 py-2 text-base font-medium text-content-inverse no-underline transition-all hover:-translate-y-0.5 hover:bg-surface hover:font-semibold hover:text-content hover:shadow-[var(--shadow-md)] md:text-lg vp-mobile:px-2.5 vp-mobile:py-1.5 vp-mobile:text-base vp-wide:px-[clamp(0.75rem,0.5rem+0.35vw,1rem)] vp-wide:py-[clamp(0.5rem,0.35rem+0.25vw,0.75rem)] vp-wide:text-[clamp(1rem,0.75rem+0.55vw,1.375rem)]'

export default function SiteNav() {
  const { isAuthenticated, user } = useAuth()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (isAuthenticated && user?.role && item.roles.includes(user.role)),
  )

  return (
    <nav className="z-40 flex w-full min-h-[70px] items-center justify-center bg-surface-inverse px-4 py-2.5 md:px-5 vp-wide:min-h-nav vp-wide:px-[clamp(1.25rem,0.75rem+1.25vw,3rem)] vp-wide:py-0">
      <ul className="m-0 flex w-full max-w-shell list-none flex-wrap items-center justify-center gap-x-6 gap-y-2 p-0 vp-mobile:gap-x-3.5 vp-compact:gap-x-3.5 vp-wide:flex-nowrap vp-wide:gap-x-[clamp(1.125rem,0.65rem+1vw,2.25rem)]">
        {visibleItems.map((item) => (
          <li key={item.label} className="flex items-center">
            {item.external ? (
              <a href={item.to} target="_blank" rel="noopener noreferrer" className={LINK_CLASSES}>
                {item.label}
              </a>
            ) : (
              <Link to={item.to} className={LINK_CLASSES}>
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
