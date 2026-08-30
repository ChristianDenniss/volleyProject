/**
 * GameScoreCard — the scoreboard row for a single match: home team and logo, the score with the winner emphasised, the away team, and a footer carrying the season and stage.
 * `TeamCrest` (exported alongside) draws a team's logo or its initials fallback, and dims the losing side so the result reads at a glance without color alone carrying it.
 * Lives in `components/ui/cards/`; used by the Games list, Schedules, a team's game history and the home page's recent results.
 */
import type { Game, Team } from '@/types/interfaces'
import { formatGameStage } from '@/utils/gameLabels'
import Pill from '@/components/ui/pills/Pill'

/** Falls back to parsing "A vs B" out of the game name when the teams relation isn't loaded. */
export function getGameTeams(game: Game): [Team | null, Team | null] {
  if (game.teams && game.teams.length >= 2) {
    return [game.teams[0], game.teams[1]]
  }

  const parts = game.name.split(' vs ')
  if (parts.length === 2) {
    return [
      { id: 0, name: parts[0].trim(), placement: '', season: game.season },
      { id: 0, name: parts[1].trim(), placement: '', season: game.season },
    ]
  }

  return [null, null]
}

function formatGameDate(date: Date | string): string {
  return new Date(date)
    .toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
    .toUpperCase()
}

interface TeamCrestProps {
  team: Team | null
  name: string
  /** Dims the crest — used for the losing side. */
  muted?: boolean
}

export function TeamCrest({ team, name, muted = false }: TeamCrestProps) {
  const dimming = muted ? 'opacity-40 grayscale' : ''

  if (team?.logoUrl) {
    return (
      <img
        src={team.logoUrl}
        alt=""
        loading="lazy"
        className={`h-10 w-10 shrink-0 rounded-full border border-border bg-surface object-contain transition-opacity ${dimming}`}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-muted bg-brand-subtle text-xs font-semibold text-accent transition-opacity ${dimming}`}
    >
      {name.trim().slice(0, 2).toUpperCase() || '?'}
    </span>
  )
}

interface Props {
  game: Game
  onClick?: () => void
  className?: string
}

export default function GameScoreCard({ game, onClick, className = '' }: Props) {
  const [team1, team2] = getGameTeams(game)
  const team1Name = team1?.name ?? 'TBD'
  const team2Name = team2?.name ?? 'TBD'

  const hasScore = game.team1Score != null && game.team2Score != null
  const team1Wins = hasScore && game.team1Score! > game.team2Score!
  const team2Wins = hasScore && game.team2Score! > game.team1Score!

  const nameClasses = (winner: boolean) =>
    `min-w-0 truncate text-sm ${winner ? 'font-semibold text-content' : 'text-content-secondary'}`
  const scoreClasses = (winner: boolean) =>
    `tabular-nums ${winner ? 'text-content' : 'text-content-tertiary'}`

  return (
    <div
      onClick={onClick}
      role={onClick ? 'link' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={`flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-all ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:border-accent hover:shadow-[var(--shadow-md)]' : ''} ${className}`}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center justify-end gap-3">
          <span className={nameClasses(team1Wins)}>{team1Name}</span>
          <TeamCrest team={team1} name={team1Name} muted={team2Wins} />
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5 text-xl font-bold">
            <span className={scoreClasses(team1Wins)}>{hasScore ? game.team1Score : '–'}</span>
            <span className="text-content-muted">:</span>
            <span className={scoreClasses(team2Wins)}>{hasScore ? game.team2Score : '–'}</span>
          </div>
          <span className="text-[0.625rem] font-medium uppercase tracking-wide text-content-muted">
            {formatGameDate(game.date)}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <TeamCrest team={team2} name={team2Name} muted={team1Wins} />
          <span className={nameClasses(team2Wins)}>{team2Name}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border bg-surface-inset px-4 py-2 text-xs text-content-tertiary">
        <Pill tone="accent" size="sm">Season {game.season.seasonNumber}</Pill>
        <span aria-hidden className="text-content-muted">·</span>
        <span>{formatGameStage(game)}</span>
      </div>
    </div>
  )
}
