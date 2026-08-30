/**
 * Applications — the public list of open and closed league positions, grouped into the four categories (staff, media, game officials, management) in a fixed display order.
 * A position's card links to its external form only when it is both open and carrying a safe URL; otherwise it renders a disabled "Applications Currently Closed" state rather than a dead link.
 * Lives in `components/`; routed at /applications. The URLs and open/closed flags are configured in the portal's ApplicationsPage.
 */
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import {
  FaUsers,
  FaCamera,
  FaFlag,
  FaShieldAlt,
  FaChartBar,
  FaMicrophone,
  FaExternalLinkAlt,
  FaLock,
  FaCheckCircle,
} from 'react-icons/fa'
import { useApplications } from '@/hooks/allFetch'
import type { Application } from '@/types/interfaces'
import { isSafeExternalUrl } from '@/utils/url'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import SectionHeader from '@/components/ui/layout/SectionHeader'
import Card from '@/components/ui/layout/Card'
import LinkButton from '@/components/ui/buttons/LinkButton'
import Button from '@/components/ui/buttons/Button'
import StatusBadge from '@/components/ui/badges/StatusBadge'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import EmptyState from '@/components/ui/feedback/EmptyState'
import { PageLoader } from '@/components/ui/feedback/LoadingSpinner'

/** Icon per position slug, falling back to the generic people glyph. */
const APPLICATION_ICONS: Record<string, ReactNode> = {
  staff: <FaUsers />,
  media: <FaCamera />,
  referee: <FaFlag />,
  moderator: <FaShieldAlt />,
  'game-moderator': <FaShieldAlt />,
  stats: <FaChartBar />,
  host: <FaMicrophone />,
}

/** Category display order and headings — the order is deliberate, not alphabetical. */
const CATEGORIES: { key: Application['category']; label: string }[] = [
  { key: 'staff', label: 'Staff Positions' },
  { key: 'media', label: 'Media & Content' },
  { key: 'game-officials', label: 'Game Officials' },
  { key: 'management', label: 'Management & Support' },
]

export default function Applications() {
  const { data: applications, loading, error } = useApplications()

  const grouped = useMemo(() => {
    const byCategory: Record<string, Application[]> = {}
    for (const app of applications ?? []) {
      ;(byCategory[app.category] ??= []).push(app)
    }
    return byCategory
  }, [applications])

  if (loading) return <PageLoader message="Loading applications…" />

  if (error) {
    return (
      <PageContainer width="wide">
        <ErrorNotice message={error} />
      </PageContainer>
    )
  }

  const hasAny = CATEGORIES.some((category) => grouped[category.key]?.length)

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Application Information"
        subtitle="All applications are carefully reviewed by our administration team. Open positions accept submissions through their linked forms; closed positions are not currently hiring. We'll reach out if your application is accepted. Please provide detailed, honest responses about your experience, availability, and interest in the role."
        actions={
          <div className="flex flex-col gap-2 text-sm text-content-tertiary">
            <span className="flex items-center gap-2">
              <FaCheckCircle aria-hidden className="text-status-success" />
              Applications Open
            </span>
            <span className="flex items-center gap-2">
              <FaLock aria-hidden className="text-content-muted" />
              Applications Closed
            </span>
          </div>
        }
      />

      {!hasAny ? (
        <EmptyState label="No positions are listed right now." />
      ) : (
        CATEGORIES.map((category) => {
          const apps = grouped[category.key]
          if (!apps?.length) return null

          return (
            <section key={category.key} className="flex flex-col gap-3">
              <SectionHeader title={category.label} count={apps.length} />

              <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
                {apps.map((app) => {
                  const isOpen = app.status === 'open' && isSafeExternalUrl(app.url)

                  return (
                    <Card key={app.slug} padding="lg" tone={isOpen ? 'surface' : 'inset'}>
                      <div className="flex h-full gap-4">
                        <span className="shrink-0 text-2xl text-accent">
                          {APPLICATION_ICONS[app.slug] ?? <FaUsers />}
                        </span>

                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="m-0 text-base font-semibold text-content">{app.name}</h3>
                            <StatusBadge status={app.status} />
                          </div>

                          <p className="m-0 text-xs uppercase tracking-wide text-content-muted">
                            {app.type}
                          </p>
                          <p className="m-0 flex-1 text-sm text-content-tertiary">
                            {app.description}
                          </p>

                          {isOpen ? (
                            <LinkButton
                              to={app.url!}
                              external
                              size="sm"
                              className="mt-1 self-start"
                            >
                              Apply Now
                              <FaExternalLinkAlt aria-hidden className="text-xs" />
                            </LinkButton>
                          ) : (
                            <Button variant="secondary" size="sm" disabled className="mt-1 self-start">
                              Applications Currently Closed
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>
          )
        })
      )}
    </PageContainer>
  )
}
