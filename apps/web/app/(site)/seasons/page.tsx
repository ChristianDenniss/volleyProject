import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@server/trpc/server";
import { getSiteRegionQuery } from "@server/site-region";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader } from "@components/site/page-header";

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
    : "Present";

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
        <div className="grid grid-cols-1 gap-8 px-5 py-12 sm:px-8 lg:grid-cols-2 xl:grid-cols-3 xl:px-14">
          {rows.map((season) => (
            <Link
              key={season.id}
              href={`/seasons/${season.id}`}
              className="group flex flex-col border border-rvl-line text-inherit no-underline transition-colors hover:border-rvl-accent-soft"
            >
              <img
                src={season.image ?? "/images/callToAction.png"}
                alt=""
                className="aspect-16/6 w-full border-b border-rvl-line object-cover"
              />

              <div className="flex flex-1 flex-col p-6">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rvl-accent">
                  {formatDate(season.startDate)} – {formatDate(season.endDate)}
                </span>

                <h2 className="mt-3 mb-0 font-display text-[1.8rem] font-black uppercase leading-none tracking-[-0.03em]">
                  Season {season.seasonNumber}
                </h2>

                {season.theme ? (
                  <span className="mt-4 self-start border border-rvl-line px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-rvl-dim">
                    {season.theme}
                  </span>
                ) : null}

                <dl className="mt-6 flex gap-8 font-mono">
                  <div className="flex flex-col gap-1">
                    <dt className="text-[0.56rem] uppercase tracking-[0.2em] text-rvl-dim">
                      Teams
                    </dt>
                    <dd className="m-0 text-[0.95rem] tabular-nums">{season.teamCount}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-[0.56rem] uppercase tracking-[0.2em] text-rvl-dim">
                      Games
                    </dt>
                    <dd className="m-0 text-[0.95rem] tabular-nums">{season.gameCount}</dd>
                  </div>
                </dl>

                <span className="mt-6 self-start border-b border-rvl-line pb-0.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-rvl-ink-2 transition-colors group-hover:border-rvl-accent-soft group-hover:text-rvl-accent">
                  Season detail →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
