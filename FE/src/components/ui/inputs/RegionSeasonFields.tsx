/**
 * RegionSeasonFields — the paired Region and Season selects that every portal create/edit form opens with, where the season list is scoped to the chosen region and stays disabled until one is picked.
 * The Season select's placeholder text reports why it is empty (no region yet / loading / this region has no seasons) instead of showing a bare "Select a season" on an empty list.
 * Lives in `components/ui/inputs/`; drive it with the `useFormRegionSeason` hook, which owns the region→season fetch chain.
 */
import type { Season } from '@/types/interfaces'
import type { Region } from '@/context/regionContext'
import type { SeasonValueKey } from '@/hooks/useFormRegionSeason'
import FormField from './FormField'
import Select from './Select'

interface Props {
  regions: Region[]
  regionsLoading?: boolean
  regionId: number | ''
  onRegionChange: (regionId: number) => void

  seasons?: Season[]
  seasonsLoading?: boolean
  seasonValue?: number | ''
  onSeasonChange?: (value: number) => void
  /** Whether the season select's value is the season's `id` or its `seasonNumber`. */
  seasonValueKey?: SeasonValueKey
  includeSeason?: boolean

  required?: boolean
  className?: string
}

export default function RegionSeasonFields({
  regions,
  regionsLoading = false,
  regionId,
  onRegionChange,
  seasons = [],
  seasonsLoading = false,
  seasonValue = '',
  onSeasonChange,
  seasonValueKey = 'id',
  includeSeason = true,
  required = true,
  className = '',
}: Props) {
  /** Says why the list is empty rather than inviting a choice that isn't available. */
  const seasonPlaceholder = !regionId
    ? 'Select a region first'
    : seasonsLoading
      ? 'Loading seasons…'
      : seasons.length === 0
        ? 'No seasons in this region'
        : 'Select a season'

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      <FormField label="Region" htmlFor="region-season-region" required={required}>
        <Select
          id="region-season-region"
          value={regionId || ''}
          onChange={(e) => onRegionChange(Number(e.target.value))}
          required={required}
          placeholder={regionsLoading ? 'Loading regions…' : 'Select a region'}
          options={regions.map((region) => ({
            value: String(region.id),
            label: region.name,
          }))}
        />
      </FormField>

      {includeSeason && onSeasonChange && (
        <FormField label="Season" htmlFor="region-season-season" required={required}>
          <Select
            id="region-season-season"
            value={seasonValue || ''}
            onChange={(e) => onSeasonChange(Number(e.target.value))}
            required={required}
            disabled={!regionId}
            placeholder={seasonPlaceholder}
            options={seasons.map((season) => ({
              value: String(seasonValueKey === 'seasonNumber' ? season.seasonNumber : season.id),
              label: `Season ${season.seasonNumber}`,
            }))}
          />
        </FormField>
      )}
    </div>
  )
}
