import { Link } from "react-router-dom";
import { FaRegCalendarAlt, FaStar, FaVolleyballBall, FaUsers } from "react-icons/fa";
import type { Season } from "@/types/interfaces";
import { useMediumSeasons } from "@/hooks/allFetch";
import { useRegion } from "@/context/regionContext";
import defaultBanner from "@/images/callToAction.png";

import PageContainer from "@/components/ui/layout/PageContainer";
import CardGrid from "@/components/ui/layout/CardGrid";

/** ISO date → "Apr 1, 2025". An absent end date means the season is still running. */
function formatSeasonDate(iso?: Date): string {
  if (!iso) return "Present";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SeasonCard({ season }: { season: Season }) {
  const stats = [
    { icon: <FaStar className="text-status-gold" />, label: "Theme", value: season.theme },
    { icon: <FaUsers className="text-status-info" />, label: "Teams", value: season.teams?.length ?? 0 },
    { icon: <FaVolleyballBall className="text-status-orange" />, label: "Games", value: season.games?.length ?? 0 },
  ];

  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-[var(--shadow-md)]">
      <img
        src={season.image ? season.image.toString() : defaultBanner}
        alt={`Season ${season.seasonNumber} banner`}
        loading="lazy"
        className="h-36 w-full object-cover"
      />

      <header className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-4">
        <h2 className="m-0 text-lg font-semibold text-content">Season {season.seasonNumber}</h2>
        <div className="flex items-center gap-1.5 text-xs text-content-tertiary">
          <FaRegCalendarAlt aria-hidden />
          {formatSeasonDate(season.startDate)} – {formatSeasonDate(season.endDate)}
        </div>
      </header>

      <ul className="m-0 flex flex-1 list-none flex-col gap-2 px-4 py-3 text-sm text-content-secondary">
        {stats.map((stat) => (
          <li key={stat.label} className="flex items-center gap-2">
            <span aria-hidden className="shrink-0">{stat.icon}</span>
            <strong className="font-medium text-content">{stat.label}:</strong>
            <span className="min-w-0 truncate">{stat.value}</span>
          </li>
        ))}
      </ul>

      <footer className="border-t border-border px-4 py-3">
        <Link
          to={`/seasons/${season.id}`}
          className="text-sm font-medium text-accent no-underline hover:underline"
        >
          View Details →
        </Link>
      </footer>
    </article>
  );
}

export default function Seasons() {
  const { regionQuery } = useRegion();
  const { data, loading, error } = useMediumSeasons(regionQuery);

  const seasons = [...(data ?? [])].sort((a, b) => b.seasonNumber - a.seasonNumber);

  return (
    <PageContainer width="wide">
      <CardGrid
        minColumnWidth="md"
        loading={loading}
        error={error}
        loadingCount={6}
        loadingHeight="h-72"
        isEmpty={seasons.length === 0}
        emptyLabel="No seasons found."
      >
        {seasons.map((season) => (
          <SeasonCard key={season.id} season={season} />
        ))}
      </CardGrid>
    </PageContainer>
  );
}
