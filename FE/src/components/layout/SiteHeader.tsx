/**
 * SiteHeader — the top bar of the public site: the league mark and wordmark on the left, and the auth affordance on the right (username + avatar + Logout when signed in, a Guest dropdown with Login / Sign Up when not).
 * The dropdown closes on outside-click and on Escape; the bar scales up on the `vp-wide` tier using the shared header height and logo size tokens.
 * Lives in `components/layout/`; rendered once by App above the nav bar, never by a page.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/authContext'
import Avatar from '@/components/ui/misc/Avatar'
import Button from '@/components/ui/buttons/Button'
import rvlLogo from '@/images/rvlLogo.png'
import pfp from '@/images/pfpLogo.png'

export default function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDropdownOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <header className="flex w-full items-center justify-between border-b border-border bg-surface px-4 py-2 md:h-[50px] md:px-10 md:py-0 vp-wide:h-header vp-wide:px-[clamp(1.5rem,1rem+1.5vw,2.5rem)]">
      <div className="flex items-center gap-3 md:gap-10 vp-wide:gap-[clamp(1.5rem,1rem+1.5vw,2.5rem)]">
        <Link to="/" aria-label="Home" className="shrink-0">
          <img
            src={rvlLogo}
            alt="Roblox Volleyball League"
            className="h-10 w-10 md:h-[50px] md:w-[50px] vp-wide:h-[clamp(3.125rem,2.25rem+0.85vw,4.375rem)] vp-wide:w-[clamp(3.125rem,2.25rem+0.85vw,4.375rem)]"
          />
        </Link>
        <span className="hidden whitespace-nowrap text-sm font-semibold text-content xs:inline md:text-base vp-wide:text-[clamp(1rem,0.85rem+0.35vw,1.25rem)]">
          volleyball-4-2.com
        </span>
      </div>

      <div className="flex items-center">
        {isAuthenticated ? (
          <div className="flex items-center gap-3 md:gap-5">
            <span className="text-sm font-medium text-content md:text-lg vp-wide:text-[clamp(1rem,0.85rem+0.35vw,1.25rem)]">
              {user?.username}
            </span>
            <Link to="/profile" aria-label="Your profile">
              <Avatar src={pfp} name={user?.username ?? 'Profile'} size="sm" className="md:h-9 md:w-9" />
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                logout()
                navigate('/')
              }}
            >
              Logout
            </Button>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-3 md:gap-5">
              <span className="text-sm font-bold text-content md:text-lg vp-wide:text-[clamp(1rem,0.85rem+0.35vw,1.25rem)]">
                Guest
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setDropdownOpen((open) => !open)}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
              >
                ☰
              </Button>
            </div>

            {dropdownOpen && (
              <div
                role="menu"
                style={{ boxShadow: 'var(--shadow-lg)' }}
                className="absolute right-0 top-[110%] z-50 flex min-w-36 flex-col gap-1 rounded-card border border-border bg-surface-elevated p-2"
              >
                <Link
                  to="/login"
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                  className="rounded-control px-3 py-2 text-sm text-content-secondary no-underline transition-colors hover:bg-surface-inset hover:text-accent"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                  className="rounded-control px-3 py-2 text-sm text-content-secondary no-underline transition-colors hover:bg-surface-inset hover:text-accent"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
