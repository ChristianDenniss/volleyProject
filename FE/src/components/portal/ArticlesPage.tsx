/**
 * ArticlesPage — the admin portal's article moderation queue: a table of submissions filtered to pending or all, where a row expands to show the article's image, summary and body before approving or rejecting it.
 * Approving from the pending view drops the row; approving from the all view updates it in place, so the moderator's list always reflects what is still outstanding.
 * Lives in `components/portal/`; mounted at /portal/articles.
 */
import { useEffect, useState } from 'react'
import { useArticles } from '@/hooks/allFetch'
import { useArticleMutations } from '@/hooks/allPatch'
import type { Article } from '@/types/interfaces'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import Toolbar from '@/components/ui/layout/Toolbar'
import DataTable, { type DataTableColumn } from '@/components/ui/layout/DataTable'
import Tabs from '@/components/ui/navigation/Tabs'
import Pagination from '@/components/ui/navigation/Pagination'
import Button from '@/components/ui/buttons/Button'
import StatusBadge from '@/components/ui/badges/StatusBadge'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'

const ARTICLES_PER_PAGE = 10

type ArticleFilter = 'pending' | 'all'

const FILTER_TABS = [
  { key: 'pending', label: 'Pending Approval' },
  { key: 'all', label: 'All Articles' },
]

/** `approved` is tri-state: null means it hasn't been reviewed yet. */
function articleStatus(article: Article): string {
  if (article.approved === null) return 'pending'
  return article.approved ? 'approved' : 'rejected'
}

export default function ArticlesPage() {
  const [filter, setFilter] = useState<ArticleFilter>('pending')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: fetchedArticles, totalPages, loading, error } = useArticles({
    page: currentPage,
    limit: ARTICLES_PER_PAGE,
    status: filter === 'pending' ? 'pending' : undefined,
  })
  const { patchArticle } = useArticleMutations()

  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    if (fetchedArticles) setArticles(fetchedArticles)
  }, [fetchedArticles])

  const setApproval = async (articleId: number, approved: boolean) => {
    setActionError(null)
    try {
      const updated = await patchArticle(articleId, { approved })
      if (!updated) return

      setArticles((prev) =>
        filter === 'pending'
          ? prev.filter((article) => article.id !== articleId)
          : prev.map((article) => (article.id === articleId ? { ...article, approved } : article))
      )
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update the article.')
    }
  }

  const columns: DataTableColumn<Article>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (article) => <span className="font-medium text-content">{article.title}</span>,
    },
    { key: 'author', header: 'Author', render: (article) => article.author.username },
    {
      key: 'createdAt',
      header: 'Created',
      hideOnMobile: true,
      render: (article) => new Date(article.createdAt).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (article) => <StatusBadge status={articleStatus(article)} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: 'w-44',
      render: (article) => (
        <div className="flex justify-end gap-2">
          {article.approved !== true && (
            <Button
              variant="success"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                void setApproval(article.id, true)
              }}
            >
              Approve
            </Button>
          )}
          {article.approved !== false && (
            <Button
              variant="danger"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                void setApproval(article.id, false)
              }}
            >
              Reject
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader title="Articles" subtitle="Review and moderate community submissions." />

      {actionError && <ErrorNotice message={actionError} />}

      <Toolbar
        filters={
          <Tabs
            items={FILTER_TABS}
            activeKey={filter}
            onChange={(key) => {
              setFilter(key as ArticleFilter)
              setCurrentPage(1)
            }}
          />
        }
        trailing={
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        }
      />

      <DataTable
        columns={columns}
        rows={articles}
        rowKey={(article) => article.id}
        loading={loading}
        error={error}
        emptyLabel={filter === 'pending' ? 'Nothing awaiting approval.' : 'No articles yet.'}
        onRowClick={(article) =>
          setExpandedId((current) => (current === article.id ? null : article.id))
        }
        expandedRow={(article) =>
          expandedId === article.id ? (
            <div className="flex flex-col gap-4 md:flex-row">
              <img
                src={article.imageUrl}
                alt={article.title}
                loading="lazy"
                className="h-40 w-full shrink-0 rounded-card border border-border object-cover md:w-64"
              />
              <div className="flex min-w-0 flex-col gap-3">
                <div>
                  <h3 className="m-0 text-sm font-semibold uppercase tracking-wide text-content-tertiary">
                    Summary
                  </h3>
                  <p className="m-0 text-sm text-content-secondary">{article.summary}</p>
                </div>
                <div>
                  <h3 className="m-0 text-sm font-semibold uppercase tracking-wide text-content-tertiary">
                    Content
                  </h3>
                  <p className="m-0 whitespace-pre-wrap text-sm text-content-secondary">
                    {article.content}
                  </p>
                </div>
              </div>
            </div>
          ) : null
        }
      />
    </PageContainer>
  )
}
