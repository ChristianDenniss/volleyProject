/**
 * ApplicationsPage — the admin portal's configuration view for the public applications page: one card per application type, each holding the external form URL and an open/closed status.
 * Edits are staged in a local draft per application and only sent on Save, so a half-typed URL never reaches the API; the card shows a transient "Saved" confirmation on success.
 * Lives in `components/portal/`; mounted at /portal/applications.
 */
import { useEffect, useMemo, useState } from 'react'
import { useApplications } from '@/hooks/allFetch'
import { useApplicationMutations } from '@/hooks/allPatch'
import type { Application } from '@/types/interfaces'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import Card from '@/components/ui/layout/Card'
import Button from '@/components/ui/buttons/Button'
import StatusBadge from '@/components/ui/badges/StatusBadge'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import EmptyState from '@/components/ui/feedback/EmptyState'
import { PageLoader } from '@/components/ui/feedback/LoadingSpinner'
import FormField from '@/components/ui/inputs/FormField'
import TextInput from '@/components/ui/inputs/TextInput'
import Select from '@/components/ui/inputs/Select'

interface Draft {
  url: string
  status: Application['status']
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
]

export default function PortalApplicationsPage() {
  const { data: applications, loading, error } = useApplications()
  const { patchApplication } = useApplicationMutations()

  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [savedSlug, setSavedSlug] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!applications) return
    setDrafts(
      Object.fromEntries(
        applications.map((application) => [
          application.slug,
          { url: application.url ?? '', status: application.status },
        ])
      )
    )
  }, [applications])

  const sortedApplications = useMemo(
    () => [...(applications ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [applications]
  )

  const updateDraft = (slug: string, updates: Partial<Draft>) => {
    setDrafts((current) => ({ ...current, [slug]: { ...current[slug], ...updates } }))
    setSavedSlug(null)
  }

  const handleSave = async (application: Application) => {
    const draft = drafts[application.slug]
    if (!draft) return

    setSavingSlug(application.slug)
    setSaveError(null)

    try {
      await patchApplication(application.slug, {
        url: draft.url.trim() || null,
        status: draft.status,
      })
      setSavedSlug(application.slug)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save application')
    } finally {
      setSavingSlug(null)
    }
  }

  if (loading) return <PageLoader message="Loading applications…" />

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Applications"
        subtitle="Configure the external form URL and open/closed status for each application type shown on the public page."
      />

      {error && <ErrorNotice message={error} />}
      {saveError && <ErrorNotice message={saveError} />}

      {sortedApplications.length === 0 ? (
        <EmptyState label="No application types configured." />
      ) : (
        <div className="flex flex-col gap-4">
          {sortedApplications.map((application) => {
            const draft = drafts[application.slug]
            if (!draft) return null

            return (
              <Card
                key={application.slug}
                padding="lg"
                header={
                  <>
                    <div className="min-w-0">
                      <h2 className="m-0 text-base font-semibold text-content">
                        {application.name}
                      </h2>
                      <p className="m-0 text-xs text-content-tertiary">{application.type}</p>
                    </div>
                    <StatusBadge status={draft.status} />
                  </>
                }
              >
                <div className="flex flex-col gap-4">
                  <p className="m-0 text-sm text-content-secondary">{application.description}</p>

                  <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                    <FormField label="Application URL" htmlFor={`url-${application.slug}`}>
                      <TextInput
                        id={`url-${application.slug}`}
                        type="url"
                        value={draft.url}
                        placeholder="https://forms.gle/…"
                        onChange={(event) =>
                          updateDraft(application.slug, { url: event.target.value })
                        }
                      />
                    </FormField>

                    <FormField label="Status" htmlFor={`status-${application.slug}`}>
                      <Select
                        id={`status-${application.slug}`}
                        value={draft.status}
                        options={STATUS_OPTIONS}
                        onChange={(event) =>
                          updateDraft(application.slug, {
                            status: event.target.value as Application['status'],
                          })
                        }
                      />
                    </FormField>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleSave(application)}
                      loading={savingSlug === application.slug}
                      loadingLabel="Saving…"
                    >
                      Save
                    </Button>
                    {savedSlug === application.slug && (
                      <span className="text-sm font-medium text-status-success">Saved</span>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
