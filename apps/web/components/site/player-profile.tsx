"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Crown,
  Crosshair,
  Lock,
  Medal,
  Shield,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Volleyball,
  Zap,
} from "lucide-react";
import { FilterSelect } from "./controls";
import { cn } from "@/lib/utils";

export type PlayerProfileTeam = {
  id: number;
  name: string;
  placement: string;
  seasonNumber: number | null;
};

export type PlayerProfileStat = {
  id: number;
  gameId: number;
  gameName: string | null;
  gameDate: string;
  seasonNumber: number | null;
  spikeKills: number;
  spikeAttempts: number;
  spikingErrors: number;
  apeKills: number;
  apeAttempts: number;
  assists: number;
  settingErrors: number;
  blocks: number;
  blockFollows: number;
  digs: number;
  aces: number;
  servingErrors: number;
  miscErrors: number;
};

export type PlayerProfileAward = {
  id: number;
  type: string;
  seasonNumber: number | null;
};

const STAT_LABELS: Record<string, string> = {
  spikeKills: "Spike Kills",
  spikeAttempts: "Spike Attempts",
  apeKills: "Ape Kills",
  apeAttempts: "Ape Attempts",
  spikingErrors: "Spiking Errors",
  digs: "Digs",
  blocks: "Blocks",
  assists: "Assists",
  aces: "Aces",
  settingErrors: "Setting Errors",
  blockFollows: "Block Follows",
  servingErrors: "Serving Errors",
  miscErrors: "Misc Errors",
  gamesPlayed: "Games Played",
  miscErrorsPerGame: "Misc Errors Per Game",
};

const AWARD_ICONS: Record<string, LucideIcon> = {
  MVP: Trophy,
  "Best Spiker": Volleyball,
  "Best Setter": Sparkles,
  "Best Libero": Shield,
  "Best Server": Crosshair,
  "Best Blocker": Lock,
  "Best Aper": Zap,
  "Best Receiver": UserRound,
  DPOS: Shield,
  FMVP: Crown,
  MIP: Medal,
  "LuvLate Award": Award,
};

const EMPTY_TOTALS = {
  spikeKills: 0,
  spikeAttempts: 0,
  apeKills: 0,
  apeAttempts: 0,
  spikingErrors: 0,
  digs: 0,
  blocks: 0,
  assists: 0,
  aces: 0,
  settingErrors: 0,
  blockFollows: 0,
  servingErrors: 0,
  miscErrors: 0,
  gamesPlayed: 0,
};

const pillClass =
  "border border-rvl-accent-soft bg-rvl-accent-soft px-4 py-2 text-center text-base text-rvl-ink no-underline transition-all duration-200 hover:-translate-y-0.5 hover:opacity-85";

const sectionTitleClass = "mt-0 mb-3 text-[1.5rem] font-bold text-rvl-ink";

function formatStatName(key: string) {
  return STAT_LABELS[key] ?? key;
}

function isChampionship(placement: string) {
  const value = placement.toLowerCase();
  return value.includes("1st place") || value.includes("champion");
}

function championshipsFor(teams: PlayerProfileTeam[]) {
  return teams.reduce((total, team) => total + (isChampionship(team.placement) ? 1 : 0), 0);
}

function awardPoints(type: string) {
  switch (type) {
    case "MVP":
      return 50;
    case "Best Spiker":
    case "Best Blocker":
      return 35;
    case "Best Aper":
    case "Best Receiver":
    case "Best Setter":
    case "FMVP":
    case "LuvLate Award":
      return 25;
    case "Best Server":
    case "MIP":
    case "Best Libero":
    case "DPOS":
      return 15;
    default:
      return 5;
  }
}

function placementPoints(placement: string) {
  switch (placement) {
    case "G.O.A.T.":
      return Number.POSITIVE_INFINITY;
    case "1st Place":
    case "1st Place (D1)":
    case "Champion":
      return 20;
    case "1st Place (D2)":
      return 18;
    case "1st Place (D3)":
      return 15;
    case "2nd Place":
    case "2nd Place (D1)":
    case "Finalist":
      return 15;
    case "2nd Place (D2)":
      return 13;
    case "2nd Place (D3)":
      return 10;
    case "3rd Place":
    case "3rd Place (D1)":
      return 10;
    case "3rd Place (D2)":
      return 8;
    case "3rd Place (D3)":
    case "Semi-finals":
      return 5;
    case "4th Place":
    case "4th Place (D1)":
      return 5;
    case "4th Place (D2)":
      return 4;
    case "4th Place (D3)":
    case "Quarter-finals":
      return 3;
    case "Top 6":
    case "Top 6 (D1)":
      return 3;
    case "Top 6 (D2)":
      return 2;
    case "Top 6 (D3)":
      return 1;
    case "Top 8":
    case "Top 8 (D1)":
      return 1;
    case "Top 8 (D2)":
      return 0.5;
    case "Top 8 (D3)":
      return 0.25;
    default:
      return 0;
  }
}

function statTier(value: number, high: number, mid: number, low: number) {
  if (value >= high) return 15;
  if (value >= mid) return 10;
  if (value >= low) return 5;
  return 0;
}

function hallOfFameScore(
  teams: PlayerProfileTeam[],
  awards: PlayerProfileAward[],
  totals: typeof EMPTY_TOTALS,
) {
  let score = awards.reduce((sum, award) => sum + awardPoints(award.type), 0);
  score += statTier(totals.spikeKills, 500, 300, 100);
  score += statTier(totals.blocks, 200, 100, 50);
  score += statTier(totals.assists, 500, 300, 100);
  score += statTier(totals.digs, 500, 300, 100);
  score += statTier(totals.aces, 20, 10, 5);
  score += statTier(totals.gamesPlayed, 100, 50, 20);

  for (const team of teams) {
    const points = placementPoints(team.placement);
    if (!Number.isFinite(points)) return Number.POSITIVE_INFINITY;
    score += points;
  }

  const teamCount = teams.length;
  if (teamCount >= 3 && teamCount <= 6) score += 5;
  else if (teamCount > 6 && teamCount <= 10) score += 10;
  else if (teamCount > 10 && teamCount <= 12) score += 15;
  else if (teamCount > 12 && teamCount <= 14) score += 20;

  return score;
}

function perGame(total: number, games: number) {
  return games ? (total / games).toFixed(1) : "0";
}

function ChampionshipRings({ count }: { count: number }) {
  if (count <= 0) return null;

  const ring = (className: string) => (
    <span
      className={cn(
        "inline-block size-9 rounded-full border-[3px] border-rvl-accent-bg shadow-[0_0_8px_var(--rvl-accent-bg)]",
        className,
      )}
    />
  );

  return (
    <div className="mb-3 flex items-center justify-center gap-0.5">
      {count === 1 ? ring("") : null}
      {count === 2 ? (
        <>
          {ring("-translate-x-1.5 -rotate-[15deg]")}
          {ring("translate-x-1.5 rotate-[15deg]")}
        </>
      ) : null}
      {count >= 3 ? (
        <>
          {ring("-translate-x-2 translate-y-0.5 -rotate-[20deg]")}
          {ring("-translate-y-0.5")}
          {ring("translate-x-2 translate-y-0.5 rotate-[20deg]")}
        </>
      ) : null}
    </div>
  );
}

function StatGrid({ entries }: { entries: [string, string | number][] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-px overflow-hidden rounded-lg bg-rvl-line min-[900px]:grid-cols-7">
      {entries.map(([label, value]) => (
        <div key={label} className="bg-rvl-panel p-4 text-center">
          <span className="mb-1 block truncate text-[0.9rem] font-semibold text-rvl-dim">
            {formatStatName(label)}
          </span>
          <span className="block text-[1.4rem] font-extrabold text-rvl-accent">{value}</span>
        </div>
      ))}
    </div>
  );
}

export function PlayerProfile({
  name,
  position,
  avatarUrl,
  robloxUserId = null,
  currentSeasonNumber,
  teams,
  stats,
  awards,
}: {
  name: string;
  position: string;
  avatarUrl: string | null;
  robloxUserId?: string | null;
  currentSeasonNumber: number | null;
  teams: PlayerProfileTeam[];
  stats: PlayerProfileStat[];
  awards: PlayerProfileAward[];
}) {
  const [selectedSeason, setSelectedSeason] = useState("0");
  const [showAllGames, setShowAllGames] = useState(false);
  const [src, setSrc] = useState(avatarUrl);

  useEffect(() => {
    setSrc(avatarUrl);
  }, [avatarUrl]);

  useEffect(() => {
    if (avatarUrl) return;

    const query = robloxUserId ? `?userId=${encodeURIComponent(robloxUserId)}` : "";
    const controller = new AbortController();

    void fetch(`/api/roblox/avatar/${encodeURIComponent(name)}${query}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const avatar = (data as { avatarUrl?: string | null } | null)?.avatarUrl;
        if (avatar) setSrc(avatar);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [avatarUrl, name, robloxUserId]);

  const uniqueSeasons = useMemo(
    () =>
      [...new Set(stats.map((line) => line.seasonNumber).filter((value): value is number => value != null))].sort(
        (a, b) => a - b,
      ),
    [stats],
  );

  const seasonNumber = Number.parseInt(selectedSeason, 10);
  const filteredStats =
    seasonNumber === 0 ? stats : stats.filter((line) => line.seasonNumber === seasonNumber);

  const totals = filteredStats.reduce(
    (accumulator, line) => ({
      spikeKills: accumulator.spikeKills + line.spikeKills,
      spikeAttempts: accumulator.spikeAttempts + line.spikeAttempts,
      apeKills: accumulator.apeKills + line.apeKills,
      apeAttempts: accumulator.apeAttempts + line.apeAttempts,
      spikingErrors: accumulator.spikingErrors + line.spikingErrors,
      digs: accumulator.digs + line.digs,
      blocks: accumulator.blocks + line.blocks,
      assists: accumulator.assists + line.assists,
      aces: accumulator.aces + line.aces,
      settingErrors: accumulator.settingErrors + line.settingErrors,
      blockFollows: accumulator.blockFollows + line.blockFollows,
      servingErrors: accumulator.servingErrors + line.servingErrors,
      miscErrors: accumulator.miscErrors + line.miscErrors,
      gamesPlayed: accumulator.gamesPlayed + 1,
    }),
    { ...EMPTY_TOTALS },
  );

  const averages = {
    spikeKills: perGame(totals.spikeKills, totals.gamesPlayed),
    spikeAttempts: perGame(totals.spikeAttempts, totals.gamesPlayed),
    apeKills: perGame(totals.apeKills, totals.gamesPlayed),
    apeAttempts: perGame(totals.apeAttempts, totals.gamesPlayed),
    spikingErrors: perGame(totals.spikingErrors, totals.gamesPlayed),
    digs: perGame(totals.digs, totals.gamesPlayed),
    blocks: perGame(totals.blocks, totals.gamesPlayed),
    assists: perGame(totals.assists, totals.gamesPlayed),
    aces: perGame(totals.aces, totals.gamesPlayed),
    settingErrors: perGame(totals.settingErrors, totals.gamesPlayed),
    blockFollows: perGame(totals.blockFollows, totals.gamesPlayed),
    servingErrors: perGame(totals.servingErrors, totals.gamesPlayed),
    miscErrorsPerGame: perGame(totals.miscErrors, totals.gamesPlayed),
  };

  const currentTeam =
    currentSeasonNumber == null
      ? null
      : (teams.find((team) => team.seasonNumber === currentSeasonNumber) ?? null);
  const mostRecentTeam = teams.reduce<PlayerProfileTeam | null>((latest, team) => {
    if (team.seasonNumber == null) return latest;
    if (!latest || (latest.seasonNumber ?? 0) < team.seasonNumber) return team;
    return latest;
  }, null);

  const games = useMemo(() => {
    const seen = new Map<number, { id: number; name: string }>();
    for (const line of stats) {
      if (!seen.has(line.gameId)) {
        seen.set(line.gameId, { id: line.gameId, name: line.gameName ?? `Game ${line.gameId}` });
      }
    }
    return [...seen.values()];
  }, [stats]);

  const visibleGames = showAllGames ? games : games.slice(0, 5);
  const championships = championshipsFor(teams);
  const hofScore = hallOfFameScore(teams, awards, totals);
  const isGoat = !Number.isFinite(hofScore);
  const hofPercentage = isGoat ? 100 : Math.min((hofScore / 100) * 100, 100);

  return (
    <div className="font-display px-5 py-8 text-rvl-ink sm:px-8 xl:px-14">
      <div className="mb-6 flex flex-wrap items-start justify-center gap-8">
        <div className="flex w-full max-w-[1200px] flex-nowrap items-center justify-center gap-8 px-4 max-[900px]:flex-col">
          <img
            src={src ?? "/images/pfpLogo.png"}
            alt={`${name}'s avatar`}
            className="size-[580px] rounded-xl object-cover max-[900px]:size-[350px] max-[600px]:size-[250px]"
            onError={() => {
              if (src !== "/images/pfpLogo.png") setSrc("/images/pfpLogo.png");
            }}
          />
          <div className="flex flex-col">
            <h1 className="mt-0 mb-4 text-[2.8rem] font-black uppercase leading-tight max-[900px]:text-[2rem] max-[600px]:text-[1.5rem]">
              {name}
            </h1>
            <div className="flex flex-col gap-2 text-base font-medium text-rvl-ink-2">
              <span>Username: {name}</span>
              <span>Position: {position || "N/A"}</span>
              <span>Current Team: {currentTeam?.name ?? "Not Active"}</span>
              <span>Most Recent Team: {mostRecentTeam?.name ?? "N/A"}</span>
              <span>Total Teams: {teams.length}</span>
              <span>Possible Games Played: {games.length}</span>
              <span>Total Stat Entries: {filteredStats.length}</span>
            </div>
          </div>
        </div>
      </div>

      <FilterSelect
        id="player-season"
        label="View stats for"
        value={selectedSeason}
        onChange={setSelectedSeason}
        options={[
          { value: "0", label: "Career" },
          ...uniqueSeasons.map((season) => ({
            value: String(season),
            label: `Season ${season}`,
          })),
        ]}
        className="mb-6 max-w-[300px]"
      />

      {filteredStats.length === 0 ? (
        <p className="mb-6 text-rvl-ink-2">No stats available for this season.</p>
      ) : (
        <div className="mb-6 rounded-xl border border-rvl-line bg-rvl-panel px-8 pt-6 pb-8">
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mt-0 mb-3 text-[1.25rem] font-bold">
                {seasonNumber === 0 ? "Career Totals" : `Season ${seasonNumber} Totals`}
              </h3>
              <StatGrid entries={Object.entries(totals)} />
            </div>
            <div>
              <h3 className="mt-0 mb-3 text-[1.25rem] font-bold">Per Game Averages</h3>
              <StatGrid entries={Object.entries(averages)} />
            </div>
          </div>
        </div>
      )}

      <section className="mt-6">
        <h3 className={sectionTitleClass}>Teams</h3>
        {teams.length === 0 ? (
          <p className="m-0 text-rvl-dim">No teams found.</p>
        ) : (
          <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
            {teams.map((team) => (
              <li key={team.id} className="flex">
                <Link href={`/teams/${encodeURIComponent(team.name)}`} className={pillClass}>
                  {team.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h3 className={sectionTitleClass}>Games Played</h3>
        {games.length === 0 ? (
          <p className="m-0 text-rvl-dim">No games found.</p>
        ) : (
          <>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {visibleGames.map((game) => (
                <li key={game.id} className="flex">
                  <Link href={`/games/${game.id}`} className={pillClass}>
                    {game.name}
                  </Link>
                </li>
              ))}
            </ul>
            {games.length > 5 ? (
              <button
                type="button"
                className="mt-3 min-w-[120px] cursor-pointer border border-rvl-line bg-rvl-panel px-3 py-1.5 font-mono text-[0.8rem] uppercase tracking-[0.5px] text-rvl-ink-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-rvl-accent-soft hover:text-rvl-accent"
                onClick={() => setShowAllGames((open) => !open)}
              >
                {showAllGames ? "Show Less" : "See More Games"}
              </button>
            ) : null}
          </>
        )}
      </section>

      <section className="mt-6">
        <h3 className={sectionTitleClass}>Awards</h3>
        {awards.length === 0 && championships === 0 ? (
          <p className="m-0 text-rvl-dim">No awards yet.</p>
        ) : (
          <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
            {championships > 0 ? (
              <li className="flex min-h-[120px] min-w-[200px] flex-col items-center justify-center border border-rvl-line bg-rvl-panel p-4 text-center transition-all duration-200 hover:scale-105 hover:border-rvl-accent-soft">
                <ChampionshipRings count={championships} />
                <span className="text-[1.2rem] font-semibold text-rvl-accent">Rings</span>
                <span className="text-[0.9rem] text-rvl-dim">
                  {championships} Championship{championships > 1 ? "s" : ""}
                </span>
              </li>
            ) : null}
            {awards.map((award) => {
              const Icon = AWARD_ICONS[award.type] ?? Trophy;
              return (
                <li key={award.id} className="flex min-w-[200px]">
                  <Link
                    href={`/awards/${award.id}`}
                    className="flex min-h-[120px] w-full flex-col items-center justify-center border border-rvl-line bg-rvl-panel p-4 text-center text-inherit no-underline transition-all duration-200 hover:scale-105 hover:border-rvl-accent-soft"
                  >
                    <Icon className="mb-3 size-10 text-rvl-accent" />
                    <span className="text-[1.2rem] font-semibold text-rvl-accent">{award.type}</span>
                    {award.seasonNumber != null ? (
                      <span className="text-[0.9rem] text-rvl-dim">Season {award.seasonNumber}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        className={cn(
          "mt-6 rounded-lg border border-rvl-line bg-rvl-panel p-6",
          isGoat && "border-rvl-accent-bg shadow-[0_0_20px_rgba(255,176,32,0.3)]",
        )}
      >
        <h3 className={sectionTitleClass}>Hall of Fame Progress</h3>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-[1.5rem] text-rvl-accent-bg">
            {isGoat ? null : <Star className="size-[1.8rem] fill-current" />}
            <span
              className={cn(
                "font-bold",
                isGoat && "animate-pulse text-[7rem] font-black drop-shadow-[0_0_12px_var(--rvl-accent-bg)]",
              )}
            >
              {isGoat ? "∞" : hofScore}
            </span>
            {isGoat ? <Star className="size-[1.8rem] fill-current" /> : null}
            <span className="text-rvl-dim">{isGoat ? "" : "/100"}</span>
          </div>
          <div className="relative h-5 min-h-5 w-full overflow-hidden rounded-[10px] bg-rvl-line">
            <div
              className="h-full rounded-[10px] bg-rvl-accent-bg"
              style={{ width: `${hofPercentage}%` }}
            />
          </div>
          <div className="text-[1.1rem] text-rvl-ink-2">
            {isGoat ? (
              <span className="font-bold uppercase tracking-wide text-rvl-accent-bg">
                G.O.A.T. - Hall of Fame Inducted!
              </span>
            ) : hofScore >= 100 ? (
              <span className="font-bold uppercase tracking-wide text-rvl-accent-bg">
                Hall of Fame Inducted! (+{hofScore - 100} points)
              </span>
            ) : (
              <span>{Math.round(hofPercentage)}% to Hall of Fame</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
