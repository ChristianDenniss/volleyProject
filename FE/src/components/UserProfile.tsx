/**
 * UserProfile — the signed-in user's account page: their identity and role, the Roblox link state with connect/disconnect actions, and the articles they have authored.
 * A rejected token (401 from the profile endpoint) logs the session out and redirects to /login rather than showing an error, since there is nothing the reader can do about it here.
 * Lives in `components/`; routed at /profile. The requests live in `useUserProfile`.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/authContext'
import { useUserProfile } from '@/hooks/useUserProfile'
import { startRobloxOAuth } from '@/hooks/useTeamRegistrations'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import SectionHeader from '@/components/ui/layout/SectionHeader'
import Card from '@/components/ui/layout/Card'
import DetailStats from '@/components/ui/layout/DetailStats'
import Button from '@/components/ui/buttons/Button'
import Pill from '@/components/ui/pills/Pill'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import EmptyState from '@/components/ui/feedback/EmptyState'
import { PageLoader } from '@/components/ui/feedback/LoadingSpinner'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading, logout } = useAuth()

  const { profile, loading, error, unauthorized, unlinkRoblox } = useUserProfile(
    !authLoading && isAuthenticated
  )
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login')
  }, [authLoading, isAuthenticated, navigate])

  useEffect(() => {
    if (unauthorized) {
      logout()
      navigate('/login')
    }
  }, [unauthorized, logout, navigate])

  if (authLoading || loading) return <PageLoader message="Loading your account…" />

  if (error) {
    return (
      <PageContainer width="narrow">
        <ErrorNotice message={error} />
      </PageContainer>
    )
  }

  if (!profile) return null

  const articles = profile.articles ?? []

  return (
    <PageContainer width="narrow">
      <PageHeader title="Your Account" />

      {actionError && <ErrorNotice message={actionError} />}

      <Card padding="lg">
        <div className="flex flex-col gap-5">
          <DetailStats
            columns={2}
            items={[
              { label: 'Username', value: profile.username },
              { label: 'Email', value: profile.email || '—' },
              {
                label: 'Role / Permissions level',
                value: <Pill tone="accent" size="sm">{profile.role}</Pill>,
              },
              {
                label: 'Roblox',
                value: profile.robloxUsername ? `@${profile.robloxUsername}` : 'Not connected',
              },
              { label: 'Join Date', value: new Date(profile.createdAt).toLocaleDateString() },
              { label: 'Last Updated', value: new Date(profile.updatedAt).toLocaleDateString() },
            ]}
          />

          <div>
            {profile.robloxUsername ? (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => setActionError(await unlinkRoblox())}
              >
                Disconnect Roblox
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  void startRobloxOAuth('connect').catch((e) =>
                    setActionError(String(e.message || e))
                  )
                }
              >
                Connect Roblox
              </Button>
            )}
          </div>
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Your Articles" count={articles.length} />
        {articles.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {articles.map((article) => (
              <li key={article.id}>
                <Link
                  to={`/articles/${article.id}`}
                  className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3 text-sm text-content no-underline transition-colors hover:border-accent hover:text-accent"
                >
                  <span className="min-w-0 truncate">{article.title}</span>
                  <Pill tone={article.approved ? 'success' : 'warning'} size="sm">
                    {article.approved ? 'Published' : 'Pending'}
                  </Pill>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState label="You have not created any articles yet." />
        )}
      </section>
    </PageContainer>
  )
}
