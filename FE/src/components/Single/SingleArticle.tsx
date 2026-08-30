/**
 * SingleArticle — one article rendered as a newspaper page: an "RVL Examiner" masthead, the hero image, headline, byline, summary lede and body, with a like button at the foot.
 * The like count is held locally and adjusted optimistically after a successful toggle, so the number moves immediately without refetching the whole article.
 * Lives in `components/Single/`; routed at /articles/:id.
 */
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FaHeart } from 'react-icons/fa'
import { useSingleArticles } from '@/hooks/allFetch'
import { useLikeArticle } from '@/hooks/useLikeArticle'
import { useLikeStatus } from '@/hooks/useLikeStatus'
import type { Article } from '@/types/interfaces'
import SEO from '@/components/SEO'

import PageContainer from '@/components/ui/layout/PageContainer'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import Skeleton, { SkeletonText } from '@/components/ui/feedback/Skeleton'

export default function SingleArticle() {
  const { id } = useParams<{ id: string }>()

  const { data, loading, error } = useSingleArticles(id ?? '')
  const { hasLiked, loading: likeStatusLoading, refetch: refetchLikeStatus } = useLikeStatus(
    Number(id ?? 0)
  )
  const { toggleLike, isLiking, error: likeError } = useLikeArticle()

  const [localLikeCount, setLocalLikeCount] = useState<number | null>(null)

  // The endpoint returns either a single article or a one-element array depending on the route.
  const article: Article | null = useMemo(() => {
    if (!data) return null
    if (Array.isArray(data)) return data.length > 0 ? data[0] : null
    return data as Article
  }, [data])

  if (!id) {
    return (
      <PageContainer width="narrow">
        <ErrorNotice message="Invalid article ID." />
      </PageContainer>
    )
  }

  const likeCount = localLikeCount ?? article?.likes ?? 0

  const handleToggleLike = async () => {
    if (!article) return
    const success = await toggleLike(article.id, hasLiked)
    if (!success) return

    // Optimistic: the server has accepted, so move the number without a refetch.
    setLocalLikeCount(hasLiked ? Math.max(likeCount - 1, 0) : likeCount + 1)
    refetchLikeStatus()
  }

  return (
    <PageContainer width="narrow">
      {article && (
        <SEO
          title={article.title}
          description={article.summary}
          image={article.imageUrl}
          url={`https://volleyball4-2.com/articles/${article.id}`}
          type="article"
          publishedTime={article.createdAt}
          author={article.author.username}
          section="News"
          tags={['volleyball', 'roblox', 'RVL', 'gaming', 'sports']}
          structuredData={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.summary,
            image: article.imageUrl,
            author: { '@type': 'Person', name: article.author.username },
            publisher: {
              '@type': 'Organization',
              name: 'Roblox Volleyball League',
              logo: {
                '@type': 'ImageObject',
                url: 'https://volleyball4-2.com/rvlLogo.png',
              },
            },
            datePublished: article.createdAt,
            dateModified: article.createdAt,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://volleyball4-2.com/articles/${article.id}`,
            },
          }}
        />
      )}

      {/* Masthead — the page's newspaper conceit, kept above every state. */}
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-y-2 border-content py-3">
        <span className="font-serif text-2xl font-bold tracking-tight text-content">
          The RVL Examiner
        </span>
        <span className="text-xs uppercase tracking-widest text-content-tertiary">
          {loading ? 'Loading…' : `Vol. 1, No. ${article?.id ?? '…'}`}
        </span>
      </header>

      {loading ? (
        <article className="flex flex-col gap-4">
          <Skeleton className="h-56 w-full !rounded-card" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <SkeletonText lines={6} />
        </article>
      ) : error ? (
        <ErrorNotice message={error} />
      ) : !article ? (
        <ErrorNotice message="No article found." />
      ) : (
        <article className="flex flex-col gap-5">
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full rounded-card border border-border object-cover"
            />
          )}

          <h1 className="m-0 text-page-title font-bold leading-tight text-content">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border pb-3 text-sm text-content-tertiary">
            <span>By {article.author.username}</span>
            <span aria-hidden className="text-content-muted">·</span>
            <span>{new Date(article.createdAt).toLocaleDateString()}</span>
          </div>

          <p className="m-0 text-lg font-medium leading-relaxed text-content-secondary">
            {article.summary}
          </p>

          <div className="whitespace-pre-wrap text-base leading-relaxed text-content-secondary">
            {article.content}
          </div>

          {likeError && <ErrorNotice message={likeError} />}

          <div className="flex items-center gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={isLiking || likeStatusLoading}
              title={
                isLiking ? 'Processing…' : hasLiked ? 'Unlike this article' : 'Like this article'
              }
              aria-pressed={hasLiked}
              className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                hasLiked
                  ? 'border-status-danger/40 bg-status-danger/10 text-status-danger'
                  : 'border-border text-content-tertiary hover:border-status-danger/40 hover:text-status-danger'
              }`}
            >
              <FaHeart aria-hidden />
            </button>
            <span className="text-sm tabular-nums text-content-secondary">
              {likeCount} {likeCount === 1 ? 'like' : 'likes'}
            </span>
          </div>
        </article>
      )}
    </PageContainer>
  )
}
