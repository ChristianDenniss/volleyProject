/**
 * hallOfFame — the Hall of Fame scoring model.
 *
 * A player's HOF score is the sum of four contributions: individual awards, career stat
 * milestones, team placements, and longevity (how many teams they've played for). 100 points
 * is induction; the score is deliberately uncapped above that so a decorated career still
 * reads as decorated.
 *
 * The one special case is the `G.O.A.T.` placement, which is instant induction — represented
 * as `Infinity` so it sorts above every finite score and renders as ∞.
 *
 * This lives in `utils/` rather than in the player page because it is a scoring *rule*, not a
 * rendering concern: the tables below are the definition of the award, and a second call site
 * (a leaderboard, an admin view) must get the same number.
 */
import type { Player, Award } from '@/types/interfaces'

/** Points per award type. Anything unlisted is worth the `DEFAULT_AWARD_POINTS` floor. */
const AWARD_POINTS: Record<string, number> = {
  MVP: 50,
  'Best Spiker': 35,
  'Best Blocker': 35,
  'Best Aper': 25,
  'Best Receiver': 25,
  'Best Setter': 25,
  FMVP: 25,
  'LuvLate Award': 25,
  'Best Server': 15,
  MIP: 15,
  'Best Libero': 15,
  DPOS: 15,
}

const DEFAULT_AWARD_POINTS = 5

/** Points per team placement. `G.O.A.T.` is handled separately as instant induction. */
const PLACEMENT_POINTS: Record<string, number> = {
  '1st Place': 20,
  '1st Place (D1)': 20,
  '1st Place (D2)': 18,
  '1st Place (D3)': 15,
  '2nd Place': 15,
  '2nd Place (D1)': 15,
  '2nd Place (D2)': 13,
  '2nd Place (D3)': 10,
  '3rd Place': 10,
  '3rd Place (D1)': 10,
  '3rd Place (D2)': 8,
  '3rd Place (D3)': 5,
  '4th Place': 5,
  '4th Place (D1)': 5,
  '4th Place (D2)': 4,
  '4th Place (D3)': 3,
  'Top 6': 3,
  'Top 6 (D1)': 3,
  'Top 6 (D2)': 2,
  'Top 6 (D3)': 1,
  'Top 8': 1,
  'Top 8 (D1)': 1,
  'Top 8 (D2)': 0.5,
  'Top 8 (D3)': 0.25,
}

/** The placement that means instant induction. */
const GOAT_PLACEMENT = 'G.O.A.T.'

/** The championship placements, for the "rings" count on a player's profile. */
const CHAMPIONSHIP_PLACEMENTS = new Set([
  '1st Place',
  '1st Place (D1)',
  '1st Place (D2)',
  '1st Place (D3)',
])

/** Career stat milestones: reaching a threshold is worth its points, best tier only. */
const STAT_TIERS: { key: string; tiers: [number, number][] }[] = [
  { key: 'spikeKills', tiers: [[500, 15], [300, 10], [100, 5]] },
  { key: 'blocks', tiers: [[200, 15], [100, 10], [50, 5]] },
  { key: 'assists', tiers: [[500, 15], [300, 10], [100, 5]] },
  { key: 'digs', tiers: [[500, 15], [300, 10], [100, 5]] },
  { key: 'aces', tiers: [[20, 15], [10, 10], [5, 5]] },
  { key: 'gamesPlayed', tiers: [[100, 15], [50, 10], [20, 5]] },
]

/** Longevity: playing for more teams is worth more, in bands. */
const TEAMS_PLAYED_BANDS: [max: number, points: number][] = [
  [6, 5],
  [10, 10],
  [12, 15],
  [14, 20],
]
const TEAMS_PLAYED_MIN = 3

/** The score that counts as induction. */
export const HOF_INDUCTION_SCORE = 100

type CareerTotals = Record<string, number>

/** How many championships a player has won, for the rings display. */
export function countChampionships(player: Pick<Player, 'teams'>): number {
  return (player.teams ?? []).filter(
    (team) => team.placement && CHAMPIONSHIP_PLACEMENTS.has(team.placement),
  ).length
}

/** Highest tier reached for a stat, or 0. */
function tierPoints(value: number, tiers: [number, number][]): number {
  for (const [threshold, points] of tiers) {
    if (value >= threshold) return points
  }
  return 0
}

/**
 * A player's Hall of Fame score. Returns `Infinity` for a G.O.A.T. placement (instant
 * induction); otherwise a finite, uncapped total.
 */
export function calculateHofScore(
  player: Pick<Player, 'teams'>,
  awards: Award[],
  careerTotals: CareerTotals,
): number {
  const teams = player.teams ?? []

  // Instant induction short-circuits everything else.
  if (teams.some((team) => team.placement === GOAT_PLACEMENT)) return Infinity

  let score = 0

  for (const award of awards) {
    score += AWARD_POINTS[award.type] ?? DEFAULT_AWARD_POINTS
  }

  for (const stat of STAT_TIERS) {
    score += tierPoints(careerTotals[stat.key] ?? 0, stat.tiers)
  }

  for (const team of teams) {
    if (team.placement) score += PLACEMENT_POINTS[team.placement] ?? 0
  }

  const teamsPlayed = teams.length
  if (teamsPlayed >= TEAMS_PLAYED_MIN) {
    const band = TEAMS_PLAYED_BANDS.find(([max]) => teamsPlayed <= max)
    if (band) score += band[1]
  }

  return score
}

/** Progress toward induction as a 0–100 percentage, clamped for display. */
export function hofProgressPercent(score: number): number {
  if (score === Infinity) return 100
  return Math.min((score / HOF_INDUCTION_SCORE) * 100, 100)
}
