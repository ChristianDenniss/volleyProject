/**
 * SingleAward — an award's detail page: a hero banner of the award artwork, the trophy's namesake blurb, the recipient(s), and the award metadata (type, season, date, team).
 * The namesake blurbs live in the `AWARD_DESCRIPTIONS` map at module scope rather than being fetched, because they are editorial copy about the trophy itself, not data about this particular award.
 * Lives in `components/Single/`; routed at /awards/:id.
 */
import { Fragment } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSingleAward } from '@/hooks/allFetch'
import defaultImage from '@/images/rvlLogo.png'
import SEO from '@/components/SEO'

import PageContainer from '@/components/ui/layout/PageContainer'
import SectionHeader from '@/components/ui/layout/SectionHeader'
import Card from '@/components/ui/layout/Card'
import DetailStats, { type DetailStatItem } from '@/components/ui/layout/DetailStats'
import Pill from '@/components/ui/pills/Pill'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import Skeleton, { SkeletonText } from '@/components/ui/feedback/Skeleton'

/** Award type → the trophy's namesake blurb. Editorial copy, not API data. */
const AWARD_DESCRIPTIONS: Record<string, string> = {
  MVP: "Enzoofbrazil Trophy (Most Valuable Player) – The Most Valuable Player award is presented to the player who made the most significant impact on their team's success and is named in honor of Enzoofbrazil for their legendary tenure of dominance and multiple MVP-caliber seasons in RVL.",
  DPOS: 'hovay Trophy (Defensive Player of the Season) – The Defensive Player of the Season award is presented to the player who demonstrated exceptional defensive skills throughout the season and is named in honor of lhovay for their era-defining stretch of defensive supremacy in RVL.',
  FMVP: 'agtheboss Trophy (Finals Most Valuable Player) – The Finals Most Valuable Player award is presented to the player who made the most significant impact in the championship series and is named in honor of agtheboss36 for their many clutch performances embodying the spirit of this award.',
  MIP: 'Lxaserr Trophy (Most Improved Player) – The Most Improved Player award is presented to the player who showed the greatest improvement throughout the season and is named in honor of Lxaserr for their breakout season which embodied exactly what this award is all about.',
  'Best Spiker':
    'sedrata Trophy (Best Spiker) – The Best Spiker award is presented to the player with the most effective and efficent attacks and is named in honor of sedrata for their unrivaled scoring and consistency in spiking, setting the benchmark for attacking greatness in 4.2.',
  'Best Setter':
    "Bacon Trophy (Best Setter) – The Best Setter award is presented to the player who excelled at setting up their teammates for successful attacks and is named in honor of Bay_kun for their long-standing excellence and consistency as one of RVL's premier playmaking setters.",
  'Best Receiver':
    'ykRising Trophy (Best Receiver) – The Best Receiver award is presented to the player who excelled at receiving serves and attacks and is named in honor of ykRising for their record-breaking reception season that redefined ground defence reliability.',
  'Best Blocker':
    'ky_xn Trophy (Best Blocker) – The Best Blocker award is presented to the player who excelled at blocking opponent attacks and is named in honor of ky_xn for their towering net presence and game-changing reads that anchored defenses across multiple seasons.',
  'Best Libero':
    'danikid Trophy (Best Libero) – The Best Libero award is presented to the player who demonstrated exceptional defensive skills and ball control and is named in honor of danikid246 for their longevity and tireless back-row leadership that set the standard for libero play.',
  'Best Aper':
    'Jxbito Trophy (Best Aper) – The Best Aper award is presented to the player who showed outstanding all-around performance in ape-style attacks and is named in honor of Jxbito for their insane, highlight-reel performances that pushed the limits of apeing strategy.',
  'Best Server':
    'yolmi Trophy (Best Server) – The Best Server award is presented to the player with the most effective and consistent serves and is named in honor of y_olmi for their creative, unpredictable service patterns that turned every rotation into a tactical advantage.',
  'LuvLate Award':
    'LuvLate Award – Special recognition for outstanding contribution to the community',
}

const FALLBACK_DESCRIPTION = 'A special recognition for outstanding achievement'

export default function SingleAward() {
  const { id } = useParams<{ id: string }>()
  const { data: award, error, loading } = useSingleAward(id || '')

  if (!id) {
    return (
      <PageContainer width="narrow">
        <ErrorNotice message="URL ID is undefined" />
      </PageContainer>
    )
  }

  if (loading) {
    return (
      <PageContainer width="wide">
        <Skeleton className="h-56 w-full !rounded-card" />
        <SkeletonText lines={3} />
        <Skeleton className="h-40 w-full !rounded-card" />
      </PageContainer>
    )
  }

  if (error || !award) {
    return (
      <PageContainer width="narrow">
        <ErrorNotice message={error || 'No award found.'} />
      </PageContainer>
    )
  }

  const recipients = award.players ?? []

  const meta: DetailStatItem[] = [
    { label: 'Award Type', value: award.type },
    { label: 'Season', value: `Season ${award.season.seasonNumber}` },
    { label: 'Awarded On', value: new Date(award.createdAt).toLocaleDateString() },
    ...(recipients.length > 0
      ? [
          {
            label: 'Team',
            value: recipients
              .map(
                (player) =>
                  player.teams?.find(
                    (team) => team.season?.seasonNumber === award.season.seasonNumber
                  )?.name ?? 'No team data'
              )
              .join(', '),
          },
        ]
      : []),
  ]

  return (
    <PageContainer width="wide">
      <SEO
        title={`${award.type} - Season ${award.season.seasonNumber}`}
        description={`${award.type} award winner${recipients.length > 1 ? 's' : ''}: ${recipients.map((p) => p.name).join(', ')}. Season ${award.season.seasonNumber} of the Roblox Volleyball League.`}
        image={award.imageUrl || 'https://volleyball4-2.com/rvlLogo.png'}
        url={`https://volleyball4-2.com/awards/${award.id}`}
        type="article"
        publishedTime={new Date(award.createdAt).toISOString()}
        author={recipients.map((p) => p.name).join(', ')}
        section="Awards"
        tags={['volleyball', 'roblox', 'RVL', 'awards', 'gaming', 'sports']}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Award',
          name: award.type,
          description:
            award.description || `${award.type} award for Season ${award.season.seasonNumber}`,
          image: award.imageUrl || 'https://volleyball4-2.com/rvlLogo.png',
          url: `https://volleyball4-2.com/awards/${award.id}`,
          awardedFor: 'Volleyball Excellence',
          awardedBy: {
            '@type': 'Organization',
            name: 'Roblox Volleyball League',
            url: 'https://volleyball4-2.com',
          },
          recipient: recipients.map((player) => ({
            '@type': 'Person',
            name: player.name,
            url: `https://volleyball4-2.com/players/${player.id}`,
          })),
          dateCreated: new Date(award.createdAt).toISOString(),
          category: 'Sports Award',
          sport: 'Volleyball',
        }}
      />

      {/* Hero — the artwork behind a scrim so the title stays legible on any image. */}
      <header className="relative flex min-h-56 flex-col justify-end overflow-hidden rounded-panel border border-border bg-surface-inverse">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${award.imageUrl || defaultImage})` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-surface-inverse via-surface-inverse/60 to-transparent"
        />
        <div className="relative z-10 flex flex-col gap-2 p-6">
          <h1 className="m-0 text-page-title font-semibold text-content-inverse">{award.type}</h1>
          <Pill tone="gold" size="md" className="self-start">
            Season {award.season.seasonNumber}
          </Pill>
        </div>
      </header>

      <Card tone="accent" padding="lg">
        <p className="m-0 text-sm leading-relaxed text-content-secondary">
          {AWARD_DESCRIPTIONS[award.type] || FALLBACK_DESCRIPTION}
        </p>
      </Card>

      {award.description && (
        <section className="flex flex-col gap-2">
          <SectionHeader title="Description" level={3} />
          <p className="m-0 text-sm leading-relaxed text-content-secondary">{award.description}</p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <SectionHeader title={recipients.length === 1 ? 'Recipient' : 'Recipients'} level={3} />
        {recipients.length > 0 ? (
          <p className="m-0 text-sm">
            {recipients.map((player, index) => (
              <Fragment key={player.id}>
                <Link
                  to={`/players/${player.id}`}
                  className="font-medium text-accent no-underline hover:underline"
                >
                  {player.name}
                </Link>
                {index < recipients.length - 1 && ', '}
              </Fragment>
            ))}
          </p>
        ) : (
          <p className="m-0 text-sm text-content-muted">No recipients recorded for this award.</p>
        )}
      </section>

      <Card padding="lg">
        <DetailStats items={meta} columns={4} />
      </Card>
    </PageContainer>
  )
}
