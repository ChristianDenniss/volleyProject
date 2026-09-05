import { cache } from "react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { api } from "@server/trpc/server";
import { PageMetric } from "@components/site/page-header";
import { TeamLeadershipBadge } from "@components/site/team-leadership-badge";
import { TeamProfileEditor } from "@components/site/team-profile-editor";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ teamName: string }>;
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Cached so generateMetadata and the page share one fetch per request.
const load = cache(async (teamName: string) =>
  (await api()).teams.byName({ name: decode(teamName) }),
);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { teamName } = await params;
  const team = await load(teamName);
  if (!team) return { title: "Team not found" };

  const description =
    team.description?.trim() ||
    `${team.name}: ${team.players.length} players, ${team.games.length} games, ${team.placement}.`;
  return {
    title: team.name,
    description,
    openGraph: { title: team.name, description, images: team.logoUrl ? [team.logoUrl] : undefined },
  };
}

function CollapsibleSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <details open className="group border-b border-rvl-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-8 marker:hidden transition-colors hover:bg-rvl-panel sm:px-8 xl:px-14 [&::-webkit-details-marker]:hidden">
        <div>
          <h2 className="m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
            {title}
          </h2>
          <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            {hint}
          </p>
        </div>
        <ChevronDown className="size-4 shrink-0 text-rvl-dim transition-transform duration-300 -rotate-90 group-open:rotate-0" />
      </summary>
      <div className="px-5 pb-12 sm:px-8 xl:px-14">{children}</div>
    </details>
  );
}

export default async function TeamPage({ params }: Params) {
  const { teamName } = await params;
  const team = await load(teamName);
  if (!team) notFound();

  return (
    <div>
      <header className="flex flex-col gap-6 border-b border-rvl-line px-5 py-12 sm:px-8 sm:py-14 lg:flex-row lg:items-end xl:px-14">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex items-center gap-5">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt=""
                className="size-16 shrink-0 border border-rvl-line object-cover sm:size-20"
              />
            ) : (
              <div
                aria-hidden
                className="flex size-16 shrink-0 items-center justify-center border border-rvl-line font-mono text-[0.62rem] uppercase tracking-[0.16em] text-rvl-dim sm:size-20"
              >
                Logo
              </div>
            )}
            <div className="min-w-0">
              <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
                Team
              </span>
              <h1 className="mt-3 mb-0 font-display text-[2.2rem] font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-[2.7rem]">
                {team.name}
              </h1>
            </div>
          </div>

          {team.description ? (
            <p className="m-0 max-w-2xl text-[0.98rem] leading-[1.55] text-rvl-ink-2">
              {team.description}
            </p>
          ) : null}

          {team.canEdit ? (
            <TeamProfileEditor
              teamId={team.id}
              teamName={team.name}
              logoUrl={team.logoUrl}
              description={team.description}
            />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-8 font-mono lg:ml-auto">
          <PageMetric label="Season" value={team.season ? team.season.seasonNumber : "-"} />
          <PageMetric label="Placement" value={team.placement} />
        </div>
      </header>

      <CollapsibleSection title="Roster" hint={`${team.players.length} players`}>
        {team.players.length === 0 ? (
          <p className="m-0 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
            No players on this roster.
          </p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 border-t border-rvl-line p-0 sm:grid-cols-2 sm:gap-x-10">
            {team.players.map((player) => (
              <li key={player.id} className="border-b border-rvl-line">
                <Link
                  href={`/players/${player.id}`}
                  className="flex items-center gap-3 py-4 text-inherit no-underline transition-colors hover:text-rvl-accent"
                >
                  <TeamLeadershipBadge role={player.role} />
                  <span className="text-[1rem] font-semibold capitalize">{player.name}</span>
                  <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.16em] text-rvl-dim">
                    {player.position}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Games" hint={`${team.games.length} played`}>
        {team.games.length === 0 ? (
          <p className="m-0 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
            No recorded games.
          </p>
        ) : (
          <div className="border-t border-rvl-line">
            {team.games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-rvl-line py-4 text-inherit no-underline transition-colors hover:bg-rvl-panel"
              >
                <span className="w-[130px] shrink-0 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-rvl-dim">
                  {game.date}
                </span>
                <span className="text-[1rem] font-semibold capitalize">
                  {game.name ?? `Game ${game.id}`}
                </span>
                <span className="font-mono text-[1.05rem] font-bold tabular-nums text-rvl-accent">
                  {game.team1Score}
                  <span className="px-1.5 text-rvl-dim">–</span>
                  {game.team2Score}
                </span>
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-rvl-dim md:ml-auto">
                  {game.stage}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
