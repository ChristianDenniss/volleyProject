/**
 * statTotals — summing and labelling for the thirteen tracked per-game statistics.
 *
 * Team pages, player pages and the record book all need "add up these stat lines and show me
 * the totals". Each used to carry its own thirteen-line reducer and its own hand-written labels,
 * which is exactly the duplication CLAUDE.md Rule 5 is about — this module owns both.
 */
import type { Stats } from '@/types/interfaces'

/** The countable statistics, and how each is labelled in the UI. */
export const STAT_TOTAL_FIELDS = [
  { key: 'spikeKills', label: 'Spike Kills' },
  { key: 'spikeAttempts', label: 'Spike Attempts' },
  { key: 'spikingErrors', label: 'Spiking Errors' },
  { key: 'apeKills', label: 'Ape Kills' },
  { key: 'apeAttempts', label: 'Ape Attempts' },
  { key: 'assists', label: 'Assists' },
  { key: 'settingErrors', label: 'Setting Errors' },
  { key: 'blocks', label: 'Blocks' },
  { key: 'digs', label: 'Digs' },
  { key: 'blockFollows', label: 'Block Follows' },
  { key: 'aces', label: 'Aces' },
  { key: 'servingErrors', label: 'Serving Errors' },
  { key: 'miscErrors', label: 'Misc Errors' },
] as const

export type StatTotalKey = (typeof STAT_TOTAL_FIELDS)[number]['key']

export type StatTotals = Record<StatTotalKey, number>

const ZERO_TOTALS: StatTotals = Object.fromEntries(
  STAT_TOTAL_FIELDS.map((field) => [field.key, 0]),
) as StatTotals

/** Adds up a list of stat lines. Non-numeric values count as zero rather than producing NaN. */
export function sumStats(lines: Stats[]): StatTotals {
  const totals = { ...ZERO_TOTALS }
  for (const line of lines) {
    for (const field of STAT_TOTAL_FIELDS) {
      const value = line[field.key]
      totals[field.key] += typeof value === 'number' ? value : 0
    }
  }
  return totals
}

/** Kill percentage, as a one-decimal string. Zero attempts reads "0.0%", not "NaN%". */
export function killPercentage(kills: number, attempts: number): string {
  if (attempts <= 0) return '0.0%'
  return `${((kills / attempts) * 100).toFixed(1)}%`
}

/** Totals as `{ label, value }` pairs, in declaration order — ready for `DetailStats`. */
export function statTotalItems(totals: StatTotals) {
  return STAT_TOTAL_FIELDS.map((field) => ({
    label: field.label,
    value: totals[field.key],
  }))
}
