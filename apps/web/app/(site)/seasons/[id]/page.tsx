import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@server/trpc/server";
import { getSiteRegion } from "@server/site-region";
import { cn } from "@/lib/utils";
import { regionQuery, type SiteRegion } from "@/lib/region";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

// Cached so generateMetadata and the page share one fetch per request.
const load = cache(async (id: string, region: SiteRegion) => {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return (await api()).seasons.byId({ id: parsed, ...regionQuery(region) });
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const region = await getSiteRegion();
  const season = await load(id, region);
  if (!season) return { title: "Season not found" };

  const title = `Season ${season.seasonNumber}`;
  const description = season.theme
    ? `${title}: ${season.theme}. ${season.teams.length} teams and ${season.games.length} games.`
    : `${title}: ${season.teams.length} teams and ${season.games.length} games.`;

  return {
    title,
    description,
    openGraph: { title, description, images: season.image ? [season.image] : undefined },
  };
}

function shortDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const year = String(parsed.getUTCFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

function placementRank(placement: string) {
  const value = placement.toLowerCase();
  if (/didn/.test(value)) return 90;
  if (/champion|\b1st\b/.test(value)) return 0;
  if (/runner|finalist|\b2nd\b/.test(value)) return 1;
  if (/\b3rd\b/.test(value)) return 2;
  if (/semi/.test(value)) return 3;
  if (/quarter/.test(value)) return 4;
  if (/playoff/.test(value)) return 5;
  return 50;
}

function isPodium(placement: string) {
  return /champion|1st|2nd|3rd|runner/i.test(placement);
}

export default async function SeasonPage({ params }: Params) {
  const { id } = await params;
  const region = await getSiteRegion();
  const season = await load(id, region);
  if (!season) notFound();

  const roster = await (await api()).teams.playersBySeason({
    seasonId: season.id,
    ...regionQuery(region),
  });
  const byTeam = new Map<number, { id: number; name: string; position: string }[]>();
  for (const row of roster) {
    byTeam.set(row.teamId, [
      ...(byTeam.get(row.teamId) ?? []),
      { id: row.id, name: row.name, position: row.position },
    ]);
  }

  const rankedTeams = [...season.teams].sort((a, b) => {
    const rank = placementRank(a.placement) - placementRank(b.placement);
    return rank !== 0 ? rank : a.name.localeCompare(b.name);
  });

  const pillClass =
    "border border-rvl-accent-soft bg-rvl-accent-soft px-4 py-2 text-center text-base text-rvl-ink";

  return (
    <div className="font-display text-rvl-ink">
      <h1 className="relative mx-auto mt-8 mb-3 min-h-20 max-w-fit text-center text-[4rem] font-black uppercase leading-tight max-md:text-[2.5rem]">
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -z-1 h-[0.4em] w-[120%] -translate-x-1/2 -translate-y-1/2 -skew-x-[25deg] bg-rvl-accent-soft"
        />
        Season {season.seasonNumber}
      </h1>

      <p className="m-0 mb-6 text-center font-mono text-[0.95rem] tabular-nums text-rvl-accent">
        {shortDate(season.startDate)} - {season.endDate ? shortDate(season.endDate) : "present"}
      </p>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
        {season.theme ? <span className={pillClass}>Theme: {season.theme}</span> : null}
        <span className={pillClass}>Teams: {season.teams.length}</span>
        <span className={pillClass}>Games: {season.games.length}</span>
        <Link
          href="/awards"
          className={`${pillClass} no-underline transition-all duration-200 hover:-translate-y-0.5 hover:opacity-85`}
        >
          View awards
        </Link>
      </div>

      {rankedTeams.length === 0 ? (
        <p className="pb-16 text-center text-lg">No teams are registered for this season.</p>
      ) : (
        <div className="mb-16 grid grid-cols-1 gap-5 overflow-visible px-5 pb-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 xl:grid-cols-4 xl:px-14">
          {rankedTeams.map((team, index) => {
            const players = byTeam.get(team.id) ?? [];

            return (
              <article
                key={team.id}
                className="group relative z-0 flex h-[425px] flex-col overflow-hidden border border-rvl-line transition-[transform,border-color,box-shadow] duration-200 hover:z-10 hover:scale-[1.03] hover:border-rvl-accent-soft hover:shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
              >
                <Link
                  href={`/teams/${encodeURIComponent(team.name)}`}
                  className="absolute inset-0 z-0"
                >
                  <span className="sr-only">{team.name}</span>
                </Link>

                <span className="pointer-events-none absolute top-3 left-3 z-1 font-mono text-[0.78rem] font-bold tabular-nums text-rvl-dim">
                  {index + 1}
                </span>

                {team.logoUrl ? (
                  <img
                    src={team.logoUrl}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-8 -right-8 size-32 object-contain opacity-[0.07] transition-opacity group-hover:opacity-15"
                  />
                ) : null}

                <div className="pointer-events-none relative flex min-h-16 flex-col">
                  <div className="flex items-center justify-center gap-3 px-10 py-4">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt=""
                        className="size-9 shrink-0 border border-rvl-line object-cover"
                      />
                    ) : null}
                    <span className="text-center text-[1.08rem] font-bold capitalize leading-tight transition-colors group-hover:text-rvl-accent">
                      {team.name}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "border-t border-rvl-line bg-rvl-panel py-2 text-center font-mono text-[0.62rem] uppercase tracking-[0.16em]",
                      isPodium(team.placement) ? "text-rvl-accent" : "text-rvl-dim",
                    )}
                  >
                    {team.placement}
                  </div>
                </div>

                <ul className="pointer-events-none relative z-1 m-0 flex-1 list-none overflow-y-auto p-0">
                  {players.length === 0 ? (
                    <li className="px-4 py-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-rvl-dim">
                      No roster
                    </li>
                  ) : (
                    players.map((player, playerIndex) => (
                      <li key={player.id} className="border-t border-rvl-line">
                        <Link
                          href={`/players/${player.id}`}
                          className="pointer-events-auto relative z-10 flex items-center gap-3 px-4 py-2.5 text-rvl-ink-2 no-underline transition-colors hover:text-rvl-accent"
                        >
                          <span className="w-4 shrink-0 font-mono text-[0.62rem] tabular-nums text-rvl-dim">
                            {playerIndex + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[0.88rem] capitalize">
                            {player.name}
                          </span>
                          {player.position && player.position !== "N/A" ? (
                            <span className="shrink-0 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-rvl-dim">
                              {player.position}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
