/**
 * Home — the landing page: a featured article beside a column of recent headlines, an auto-playing promo video, and the join call-to-action.
 * The headline column is sized to match the featured card and shows as many articles as fit at a readable height — measured with a ResizeObserver rather than assumed, because the featured card's height depends on its image and summary length.
 * Lives in `components/`; routed at /. The video plays only while it is actually on screen (IntersectionObserver), so it never runs unseen in a background tab.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useArticles } from '@/hooks/allFetch'
import promoImg from '@/images/callToAction.png'
import SEO from '@/components/SEO'
import {
  getVisualViewportWidth,
  subscribeVisualViewport,
  viewportThresholds,
} from '@/utils/visualViewport'

import PageContainer from '@/components/ui/layout/PageContainer'
import LinkButton from '@/components/ui/buttons/LinkButton'
import Pill from '@/components/ui/pills/Pill'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import EmptyState from '@/components/ui/feedback/EmptyState'
import Skeleton from '@/components/ui/feedback/Skeleton'

const MAX_SIDE_ARTICLES = 5
const DEFAULT_SIDE_ARTICLE_COUNT = 4
const LARGE_SIDE_ARTICLE_COUNT = 5
/** Smallest headline card that still reads well, and the gap between them (px). */
const SIDE_ARTICLE_MIN_HEIGHT = 80
const SIDE_ARTICLE_GAP = 16

const PROMO_VIDEO_ID = 'jUYJKjPvPoQ'

/** Minimal shape of the YouTube IFrame player we actually use. */
interface YouTubePlayer {
  playVideo: () => void
  pauseVideo: () => void
  destroy: () => void
}

export default function Home() {
  const playerRef = useRef<YouTubePlayer | null>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const featuredRef = useRef<HTMLDivElement>(null)
  const headlineSectionRef = useRef<HTMLElement>(null)
  const sideArticlesRef = useRef<HTMLElement>(null)

  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [visibleSideCount, setVisibleSideCount] = useState(DEFAULT_SIDE_ARTICLE_COUNT)

  const { data: articles = [], loading, error } = useArticles()

  const approvedNewestFirst = useMemo(
    () =>
      Array.isArray(articles)
        ? [...articles].filter((article) => article.approved === true).sort((a, b) => b.id - a.id)
        : [],
    [articles]
  )

  const featuredArticle = approvedNewestFirst[0] ?? null
  const allSideArticles = useMemo(
    () => approvedNewestFirst.slice(1, 1 + MAX_SIDE_ARTICLES),
    [approvedNewestFirst]
  )
  const sideArticles = allSideArticles.slice(0, visibleSideCount)

  /* Match the headline column to the featured card, and fit as many headlines as will read. */
  useEffect(() => {
    const featuredColumn = featuredRef.current
    const headlineSection = headlineSectionRef.current
    const sideArticlesEl = sideArticlesRef.current
    if (!featuredColumn || !headlineSection) return

    const updateVisibleSideCount = () => {
      const { compactMax, homeLargeMin } = viewportThresholds()
      const viewportWidth = getVisualViewportWidth()
      const isStacked = viewportWidth <= compactMax

      const featuredCard = featuredColumn.firstElementChild as HTMLElement | null
      const featuredHeight = featuredCard?.getBoundingClientRect().height ?? 0

      // Pin the column height to the featured card, except when the two are stacked.
      if (sideArticlesEl) {
        sideArticlesEl.style.height =
          isStacked || featuredHeight <= 0 ? '' : `${featuredHeight}px`
      }

      if (isStacked) {
        setVisibleSideCount(Math.min(allSideArticles.length, DEFAULT_SIDE_ARTICLE_COUNT))
        return
      }
      if (featuredHeight <= 0) return

      const maxByHeight = Math.floor(
        (featuredHeight + SIDE_ARTICLE_GAP) / (SIDE_ARTICLE_MIN_HEIGHT + SIDE_ARTICLE_GAP)
      )
      const target =
        viewportWidth >= homeLargeMin && maxByHeight >= LARGE_SIDE_ARTICLE_COUNT
          ? LARGE_SIDE_ARTICLE_COUNT
          : DEFAULT_SIDE_ARTICLE_COUNT

      setVisibleSideCount(Math.max(1, Math.min(target, maxByHeight, allSideArticles.length)))
    }

    const observer = new ResizeObserver(updateVisibleSideCount)
    observer.observe(featuredColumn)
    observer.observe(headlineSection)
    const unsubscribe = subscribeVisualViewport(updateVisibleSideCount)
    updateVisibleSideCount()

    return () => {
      observer.disconnect()
      unsubscribe()
      if (sideArticlesEl) sideArticlesEl.style.height = ''
    }
  }, [allSideArticles.length, loading, featuredArticle?.id])

  /* Load the YouTube IFrame API once and build the player. */
  useEffect(() => {
    const globalWindow = window as unknown as {
      YT?: { Player: new (id: string, options: unknown) => YouTubePlayer }
      onYouTubeIframeAPIReady?: () => void
    }

    const createPlayer = () => {
      if (!globalWindow.YT?.Player) return
      playerRef.current = new globalWindow.YT.Player('yt-player', {
        videoId: PROMO_VIDEO_ID,
        playerVars: { modestbranding: 1, rel: 0, controls: 1, showinfo: 0, autoplay: 0, mute: 1 },
        events: { onReady: () => setIsPlayerReady(true) },
      })
    }

    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script')
      tag.id = 'youtube-iframe-api'
      tag.src = 'https://www.youtube.com/iframe_api'
      document.body.appendChild(tag)
      globalWindow.onYouTubeIframeAPIReady = createPlayer
    } else if (globalWindow.YT?.Player) {
      createPlayer()
    } else {
      globalWindow.onYouTubeIframeAPIReady = createPlayer
    }

    return () => {
      delete globalWindow.onYouTubeIframeAPIReady
      playerRef.current?.destroy()
      playerRef.current = null
      setIsPlayerReady(false)
    }
  }, [])

  /* Play only while the video is meaningfully on screen. */
  useEffect(() => {
    if (!videoContainerRef.current || !isPlayerReady || !playerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) playerRef.current?.playVideo()
          else playerRef.current?.pauseVideo()
        }
      },
      { threshold: [0, 0.6, 1] }
    )
    observer.observe(videoContainerRef.current)
    return () => observer.disconnect()
  }, [isPlayerReady])

  return (
    <PageContainer width="shell" className="overflow-x-hidden">
      <SEO
        title="Volleyball 4-2 - Official Roblox Volleyball League"
        description="Join the official Roblox Volleyball League (RVL). Watch matches, track player stats, view team rankings, and stay updated with the latest volleyball news and events."
        image="https://volleyball4-2.com/rvlLogo.png"
        url="https://volleyball4-2.com"
        type="website"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Volleyball 4-2',
          alternateName: 'RVL',
          url: 'https://volleyball4-2.com',
          description: 'Official Roblox Volleyball League - Competitive volleyball gaming community',
          publisher: {
            '@type': 'Organization',
            name: 'Roblox Volleyball League',
            logo: {
              '@type': 'ImageObject',
              url: 'https://volleyball4-2.com/rvlLogo.png',
            },
          },
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://volleyball4-2.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }}
      />

      <section ref={headlineSectionRef} className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div ref={featuredRef} className="min-w-0">
          {loading ? (
            <Skeleton className="h-96 w-full !rounded-panel" />
          ) : error ? (
            <ErrorNotice message={error} />
          ) : featuredArticle ? (
            <Link
              to={`/articles/${featuredArticle.id}`}
              className="group relative flex h-full min-h-96 flex-col justify-end overflow-hidden rounded-panel border border-border bg-surface-inverse no-underline"
            >
              <img
                src={featuredArticle.imageUrl}
                alt={featuredArticle.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-surface-inverse via-surface-inverse/70 to-transparent"
              />
              <div className="relative z-10 flex flex-col gap-2 p-6">
                <div className="flex flex-wrap gap-2">
                  <Pill tone="accent" size="sm">By {featuredArticle.author.username}</Pill>
                  <Pill tone="neutral" size="sm">
                    {new Date(featuredArticle.createdAt).toLocaleDateString()}
                  </Pill>
                </div>
                <h2 className="m-0 text-2xl font-bold leading-tight text-content-inverse">
                  {featuredArticle.title}
                </h2>
                <p className="m-0 line-clamp-3 text-sm text-content-inverse/80">
                  {featuredArticle.summary}
                </p>
              </div>
            </Link>
          ) : (
            <EmptyState
              title="No Featured Articles Yet"
              description="Check back soon for the latest news and updates!"
              className="h-full min-h-96 justify-center"
            />
          )}
        </div>

        <aside
          ref={sideArticlesRef}
          aria-label="Recent headlines"
          className="flex min-w-0 flex-col gap-4 overflow-hidden"
        >
          {loading ? (
            Array.from({ length: visibleSideCount }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full !rounded-card" />
            ))
          ) : error ? (
            <ErrorNotice message={error} />
          ) : sideArticles.length > 0 ? (
            sideArticles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.id}`}
                className="flex min-h-20 flex-1 items-center gap-3 overflow-hidden rounded-card border border-border bg-surface p-3 no-underline transition-colors hover:border-accent"
              >
                <h4 className="m-0 min-w-0 flex-1 line-clamp-3 text-sm font-medium text-content">
                  {article.title}
                </h4>
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-14 w-20 shrink-0 rounded-control object-cover"
                  />
                )}
              </Link>
            ))
          ) : (
            <EmptyState
              label="No recent articles available."
              description="More content coming soon!"
            />
          )}
        </aside>
      </section>

      <section
        ref={videoContainerRef}
        aria-label="Volleyball promotional video"
        className="overflow-hidden rounded-panel border border-border bg-surface-inverse"
      >
        <div id="yt-player" className="aspect-video w-full" />
      </section>

      <section className="relative flex min-h-56 flex-col items-center justify-center overflow-hidden rounded-panel border border-border">
        <img src={promoImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-surface-inverse/50" />
        {/* Behaviour change: this button used to fire `alert("Join RVL Today!")`, a placeholder.
            It now goes where its label says — the same Discord invite the nav bar links to. */}
        <LinkButton to="https://discord.gg/volleyball" external size="lg" className="relative z-10">
          Join RVL Today
        </LinkButton>
      </section>
    </PageContainer>
  )
}
