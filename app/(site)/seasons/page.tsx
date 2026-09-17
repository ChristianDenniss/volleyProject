import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Star, Users, Volleyball } from "lucide-react";
import { api } from "@server/trpc/server";
import { getSiteRegionQuery } from "@server/site-region";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader } from "@components/site/page-header";
import { seasonBanner } from "@/lib/season-banners";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seasons",
  description: "Every season of the Roblox Volleyball League, newest first.",
};

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "TBH";

const accentClass =
  "text-rvl-dim transition-colors duration-200 group-hover:text-rvl-accent-bg";

const iconClass = `size-[1.1rem] shrink-0 ${accentClass}`;

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: string | number;
}) {
  return (
    <li className="flex items-center gap-2">
      <Icon aria-hidden="true" className={iconClass} />
      <span>
        <strong>{label}:</strong> {value}
      </span>
    </li>
  );
}

export default async function SeasonsPage() {
  const [trpc, { query }] = await Promise.all([api(), getSiteRegionQuery()]);
  const rows = await trpc.seasons.list(query);

  return (
    <div>
      <PageHeader
        eyebrow="Archive"
        title="Seasons"
        description="Every season the league has run, newest first, with its theme and the size of its field."
      />

      {rows.length === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>No seasons have been created yet.</EmptyState>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 xl:px-14">
          {rows.map((season) => (
            <Link
              key={season.id}
              href={`/seasons/${season.id}`}
              className="group flex min-h-75 flex-col overflow-hidden rounded-[14px] border border-rvl-line bg-rvl-ground text-rvl-dim no-underline shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.75 hover:border-rvl-accent-soft hover:shadow-[0_6px_12px_rgba(0,0,0,0.08)]"
            >
              <img
                src={seasonBanner(season.seasonNumber, season.image)}
                alt=""
                className="aspect-16/6 w-full rounded-t-[14px] object-cover opacity-80 transition-opacity duration-200 group-hover:opacity-100"
              />

              <div className="flex flex-1 flex-col px-10 pb-8 max-sm:px-9">
                <header className="flex flex-col items-center gap-3 pt-6">
                  <h2 className={`m-0 font-display text-[1.6rem] font-bold ${accentClass}`}>
                    Season {season.seasonNumber}
                  </h2>
                  <div className={`m-0 flex items-center gap-2 font-mono text-base font-semibold ${accentClass}`}>
                    <Calendar aria-hidden="true" className={iconClass} />
                    {formatDate(season.startDate)} – {formatDate(season.endDate)}
                  </div>
                </header>

                <ul className="mt-6 mb-0 flex flex-1 list-none flex-col gap-3 p-0 font-mono text-[1.1rem] font-semibold leading-relaxed">
                  <StatRow icon={Star} label="Theme" value={season.theme ?? "N/A"} />
                  <StatRow icon={Users} label="Teams" value={season.teamCount} />
                  <StatRow icon={Volleyball} label="Games" value={season.gameCount} />
                </ul>

                <span className={`mt-6 self-end font-mono text-[0.95rem] font-bold ${accentClass}`}>
                  View Details →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
