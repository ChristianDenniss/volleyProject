/**
 * RegionSwitcher — the region selector that scopes every list on the site to one league region, reading and writing the shared `regionContext`.
 * Renders nothing while regions are loading or when none is active, so a page can place it unconditionally without a guard of its own.
 * Lives in `components/ui/filters/`; drop it into a `layout/Toolbar` filters slot alongside the page's own filters.
 */
import { useRegion } from '@/context/regionContext'
import Select from '@/components/ui/inputs/Select'

interface Props {
  className?: string
}

export default function RegionSwitcher({ className = '' }: Props) {
  const { regions, activeRegion, setActiveRegion, loading } = useRegion()

  if (loading || !activeRegion) return null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="region-select" className="text-xs font-medium uppercase tracking-wide text-content-tertiary">
        Region
      </label>
      <Select
        id="region-select"
        size="sm"
        value={activeRegion.code}
        onChange={(e) => {
          const next = regions.find((region) => region.code === e.target.value)
          if (next) setActiveRegion(next)
        }}
        options={regions.map((region) => ({ value: region.code, label: region.name }))}
        className="w-auto min-w-[8rem]"
      />
    </div>
  )
}
