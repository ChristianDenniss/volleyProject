"use client";

import { useMemo, useState } from "react";
import { ChevronRightIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@components/ui/collapsible";
import { Input } from "@components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";

export type SheetRegion = "na" | "eu" | "as";

const REGION_GROUPS: { id: SheetRegion; label: string }[] = [
  { id: "na", label: "NA" },
  { id: "eu", label: "EU" },
  { id: "as", label: "AS" },
];

export type SheetImportPreviewData = {
  mode: "full" | "teams" | "teams_and_players" | "players";
  seasonNumber: number | null;
  seasonId: number | null;
  counts: {
    teams: number;
    players: number;
    playersNew: number;
    playersExisting: number;
    games: number;
    stats: number;
    warnings: number;
    errors: number;
  };
  teams: {
    key: string;
    name: string;
    region: SheetRegion | null;
    playerNames: string[];
    leadership?: Partial<Record<"C" | "VC" | "CC", string>> | undefined;
    included: boolean;
  }[];
  players: { name: string; teamName: string; exists: boolean }[];
  games: {
    key: string;
    region: SheetRegion;
    phase: "qualifiers" | "playoffs";
    round: string;
    date: string;
    team1Name: string;
    team2Name: string;
    team1Score: number | null;
    team2Score: number | null;
    setScores: string[];
    matchedStatCount: number;
    included: boolean;
    forfeit: boolean;
  }[];
  stats: {
    gameKey: string;
    teamName: string;
    playerName: string;
    counts: {
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
  }[];
  warnings: string[];
  errors: string[];
};

function Chip({ label }: { label: string }) {
  return (
    <span className="border border-rvl-line px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-ink-2">
      {label}
    </span>
  );
}

function LeadershipChips({
  leadership,
}: {
  leadership?: Partial<Record<"C" | "VC" | "CC", string>>;
}) {
  if (!leadership) return null;
  const chips = (["C", "VC", "CC"] as const)
    .map((role) => {
      const name = leadership[role];
      return name ? { role, name } : null;
    })
    .filter((row): row is { role: "C" | "VC" | "CC"; name: string } => row != null);
  if (chips.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {chips.map((chip) => (
        <span
          key={chip.role}
          title={`${chip.role}: ${chip.name}`}
          className="border border-rvl-accent-soft bg-rvl-accent-bg px-1.5 py-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.1em] text-rvl-on-accent"
        >
          {chip.role} {chip.name}
        </span>
      ))}
    </span>
  );
}

function matchesQuery(haystack: string, query: string): boolean {
  if (!query) return true;
  return haystack.toLowerCase().includes(query.toLowerCase());
}

export function SheetImportPreviewTables({
  preview,
  excludedTeams,
  excludedGames,
  onToggleTeam,
  onToggleGame,
  showGames,
}: {
  preview: SheetImportPreviewData;
  excludedTeams: Set<string>;
  excludedGames: Set<string>;
  onToggleTeam: (key: string) => void;
  onToggleGame: (key: string) => void;
  showGames: boolean;
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<"all" | SheetRegion>("all");
  const [playerStatus, setPlayerStatus] = useState<"all" | "new" | "existing">("all");
  const [gamePhase, setGamePhase] = useState<"all" | "qualifiers" | "playoffs">("all");
  const [statsFilter, setStatsFilter] = useState<"all" | "matched" | "missing">("all");
  const [includeFilter, setIncludeFilter] = useState<"all" | "included" | "excluded">("all");

  const filteredTeams = useMemo(() => {
    return preview.teams.filter((team) => {
      if (region !== "all" && team.region !== region) return false;
      if (includeFilter === "included" && excludedTeams.has(team.key)) return false;
      if (includeFilter === "excluded" && !excludedTeams.has(team.key)) return false;
      return (
        matchesQuery(team.name, query) ||
        team.playerNames.some((name) => matchesQuery(name, query))
      );
    });
  }, [preview.teams, region, includeFilter, excludedTeams, query]);

  const teamsByRegion = useMemo(() => {
    const groups: Record<SheetRegion | "other", typeof filteredTeams> = {
      na: [],
      eu: [],
      as: [],
      other: [],
    };
    for (const team of filteredTeams) {
      if (team.region === "na" || team.region === "eu" || team.region === "as") {
        groups[team.region].push(team);
      } else {
        groups.other.push(team);
      }
    }
    for (const key of Object.keys(groups) as Array<keyof typeof groups>) {
      groups[key].sort((left, right) => left.name.localeCompare(right.name));
    }
    return groups;
  }, [filteredTeams]);

  const filteredPlayers = useMemo(() => {
    return preview.players.filter((player) => {
      if (playerStatus === "new" && player.exists) return false;
      if (playerStatus === "existing" && !player.exists) return false;
      if (region !== "all") {
        const team = preview.teams.find((row) => row.name === player.teamName);
        if (team?.region && team.region !== region) return false;
      }
      return matchesQuery(player.name, query) || matchesQuery(player.teamName, query);
    });
  }, [preview.players, preview.teams, playerStatus, region, query]);

  const filteredGames = useMemo(() => {
    return preview.games.filter((game) => {
      if (region !== "all" && game.region !== region) return false;
      if (gamePhase !== "all" && game.phase !== gamePhase) return false;
      if (statsFilter === "matched" && game.matchedStatCount <= 0) return false;
      if (statsFilter === "missing" && game.matchedStatCount > 0) return false;
      if (includeFilter === "included" && excludedGames.has(game.key)) return false;
      if (includeFilter === "excluded" && !excludedGames.has(game.key)) return false;
      return matchesQuery(
        `${game.team1Name} ${game.team2Name} ${game.round} ${game.date}`,
        query,
      );
    });
  }, [preview.games, region, gamePhase, statsFilter, includeFilter, excludedGames, query]);

  const filteredStats = useMemo(() => {
    return preview.stats.filter((stat) => {
      if (region !== "all") {
        const game = preview.games.find((row) => row.key === stat.gameKey);
        if (game && game.region !== region) return false;
      }
      return matchesQuery(stat.playerName, query) || matchesQuery(stat.teamName, query);
    });
  }, [preview.stats, preview.games, region, query]);

  const filteredWarnings = useMemo(() => {
    return preview.warnings.filter((warning) => matchesQuery(warning, query));
  }, [preview.warnings, query]);

  const selectClass =
    "h-9 rounded-xs border border-rvl-line bg-transparent px-2 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-rvl-ink-2";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Chip label={`${preview.counts.teams} teams`} />
        <Chip label={`${preview.counts.players} players`} />
        <Chip label={`${preview.counts.playersNew} new`} />
        {showGames ? <Chip label={`${preview.counts.games} games`} /> : null}
        {showGames ? <Chip label={`${preview.counts.stats} stats`} /> : null}
        <Chip label={`${preview.warnings.length} warnings`} />
        {preview.errors.length > 0 ? <Chip label={`${preview.errors.length} errors`} /> : null}
      </div>

      {preview.errors.length > 0 ? (
        <ul className="space-y-1 border border-red-500/40 bg-red-500/10 p-3 font-mono text-[0.72rem] text-red-200">
          {preview.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border border-rvl-line p-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search teams, players, matches…"
          className="h-9 min-w-56 flex-1 rounded-xs border-rvl-line bg-transparent"
        />
        <select
          className={selectClass}
          value={region}
          onChange={(event) => setRegion(event.target.value as "all" | SheetRegion)}
        >
          <option value="all">All regions</option>
          <option value="na">NA</option>
          <option value="eu">EU</option>
          <option value="as">AS</option>
        </select>
        <select
          className={selectClass}
          value={playerStatus}
          onChange={(event) => setPlayerStatus(event.target.value as "all" | "new" | "existing")}
        >
          <option value="all">All players</option>
          <option value="new">New only</option>
          <option value="existing">Existing only</option>
        </select>
        {showGames ? (
          <>
            <select
              className={selectClass}
              value={gamePhase}
              onChange={(event) =>
                setGamePhase(event.target.value as "all" | "qualifiers" | "playoffs")
              }
            >
              <option value="all">All phases</option>
              <option value="qualifiers">Qualifiers</option>
              <option value="playoffs">Playoffs</option>
            </select>
            <select
              className={selectClass}
              value={statsFilter}
              onChange={(event) =>
                setStatsFilter(event.target.value as "all" | "matched" | "missing")
              }
            >
              <option value="all">All stats</option>
              <option value="matched">Has stats</option>
              <option value="missing">Missing stats</option>
            </select>
          </>
        ) : null}
        <select
          className={selectClass}
          value={includeFilter}
          onChange={(event) =>
            setIncludeFilter(event.target.value as "all" | "included" | "excluded")
          }
        >
          <option value="all">Included + excluded</option>
          <option value="included">Included only</option>
          <option value="excluded">Excluded only</option>
        </select>
      </div>

      <Tabs defaultValue="teams" className="flex min-h-0 flex-1 flex-col gap-2">
        <TabsList
          variant="line"
          className="h-auto w-full shrink-0 justify-start overflow-x-auto overflow-y-hidden pb-1.5"
        >
          <TabsTrigger value="teams">Teams ({filteredTeams.length})</TabsTrigger>
          <TabsTrigger value="players">Players ({filteredPlayers.length})</TabsTrigger>
          {showGames ? (
            <TabsTrigger value="games">Games ({filteredGames.length})</TabsTrigger>
          ) : null}
          {showGames ? (
            <TabsTrigger value="stats">Stats ({filteredStats.length})</TabsTrigger>
          ) : null}
          <TabsTrigger value="warnings">Warnings ({filteredWarnings.length})</TabsTrigger>
        </TabsList>

        <TabsContent
          value="teams"
          className="mt-0 min-h-96 flex-1 overflow-auto border border-rvl-line"
        >
          <div className="divide-y divide-rvl-line">
            {REGION_GROUPS.filter((group) => region === "all" || region === group.id).map(
              (group) => {
                const teams = teamsByRegion[group.id];
                return (
                  <Collapsible key={group.id} className="group/region">
                    <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-rvl-panel/60">
                      <ChevronRightIcon className="size-4 shrink-0 text-rvl-ink-2 transition-transform duration-200 group-data-[state=open]/region:rotate-90" />
                      <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.16em] text-rvl-ink">
                        {group.label}
                      </span>
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-ink-2">
                        {teams.length} team{teams.length === 1 ? "" : "s"}
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {teams.length === 0 ? (
                        <p className="border-t border-rvl-line px-3 py-3 font-mono text-[0.68rem] text-rvl-ink-2">
                          No teams in this region
                        </p>
                      ) : (
                        <ul className="border-t border-rvl-line">
                          {teams.map((team) => {
                            const playerCount = team.playerNames.length;
                            return (
                              <li
                                key={team.key}
                                className="flex flex-wrap items-center gap-3 border-t border-rvl-line/70 px-3 py-2 text-[0.78rem] first:border-t-0"
                              >
                                <input
                                  type="checkbox"
                                  className="shrink-0"
                                  checked={!excludedTeams.has(team.key)}
                                  onChange={() => onToggleTeam(team.key)}
                                  aria-label={`Include ${team.name}`}
                                />
                                <span className="min-w-0 flex-1 truncate text-rvl-ink">
                                  {team.name}
                                </span>
                                <LeadershipChips
                                  {...(team.leadership ? { leadership: team.leadership } : {})}
                                />
                                <span className="shrink-0 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-ink-2">
                                  {playerCount} player{playerCount === 1 ? "" : "s"}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              },
            )}
            {teamsByRegion.other.length > 0 && region === "all" ? (
              <Collapsible className="group/region">
                <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-rvl-panel/60">
                  <ChevronRightIcon className="size-4 shrink-0 text-rvl-ink-2 transition-transform duration-200 group-data-[state=open]/region:rotate-90" />
                  <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.16em] text-rvl-ink">
                    Other
                  </span>
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-ink-2">
                    {teamsByRegion.other.length} team
                    {teamsByRegion.other.length === 1 ? "" : "s"}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="border-t border-rvl-line">
                    {teamsByRegion.other.map((team) => {
                      const playerCount = team.playerNames.length;
                      return (
                        <li
                          key={team.key}
                          className="flex flex-wrap items-center gap-3 border-t border-rvl-line/70 px-3 py-2 text-[0.78rem] first:border-t-0"
                        >
                          <input
                            type="checkbox"
                            className="shrink-0"
                            checked={!excludedTeams.has(team.key)}
                            onChange={() => onToggleTeam(team.key)}
                            aria-label={`Include ${team.name}`}
                          />
                          <span className="min-w-0 flex-1 truncate text-rvl-ink">{team.name}</span>
                          <LeadershipChips
                            {...(team.leadership ? { leadership: team.leadership } : {})}
                          />
                          <span className="shrink-0 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-ink-2">
                            {playerCount} player{playerCount === 1 ? "" : "s"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent
          value="players"
          className="mt-0 min-h-96 flex-1 overflow-auto border border-rvl-line"
        >
          <table className="w-full text-left text-[0.78rem]">
            <thead className="sticky top-0 bg-rvl-panel font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-ink-2">
              <tr>
                <th className="p-2">Player</th>
                <th className="p-2">Team</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player, index) => (
                <tr
                  key={`${player.name}-${player.teamName}-${index}`}
                  className="border-t border-rvl-line"
                >
                  <td className="p-2">{player.name}</td>
                  <td className="p-2">{player.teamName}</td>
                  <td className="p-2">{player.exists ? "existing" : "new"}</td>
                </tr>
              ))}
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td className="p-3 font-mono text-[0.68rem] text-rvl-ink-2" colSpan={3}>
                    No players match these filters
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TabsContent>

        {showGames ? (
          <TabsContent
            value="games"
            className="mt-0 min-h-96 flex-1 overflow-auto border border-rvl-line"
          >
            <table className="w-full text-left text-[0.78rem]">
              <thead className="sticky top-0 bg-rvl-panel font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-ink-2">
                <tr>
                  <th className="p-2">Include</th>
                  <th className="p-2">Match</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Stats</th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.map((game) => (
                  <tr key={game.key} className="border-t border-rvl-line">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={!excludedGames.has(game.key)}
                        onChange={() => onToggleGame(game.key)}
                      />
                    </td>
                    <td className="p-2">
                      <div>
                        {game.team1Name} vs {game.team2Name}
                      </div>
                      <div className="font-mono text-[0.62rem] uppercase text-rvl-ink-2">
                        {game.region} · {game.phase} · {game.round} · {game.date}
                        {game.forfeit ? " · forfeit" : ""}
                      </div>
                    </td>
                    <td className="p-2">
                      {game.team1Score ?? "—"}-{game.team2Score ?? "—"}
                    </td>
                    <td className="p-2">{game.matchedStatCount}</td>
                  </tr>
                ))}
                {filteredGames.length === 0 ? (
                  <tr>
                    <td className="p-3 font-mono text-[0.68rem] text-rvl-ink-2" colSpan={4}>
                      No games match these filters
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TabsContent>
        ) : null}

        {showGames ? (
          <TabsContent
            value="stats"
            className="mt-0 min-h-96 flex-1 overflow-auto border border-rvl-line"
          >
            <table className="w-full text-left text-[0.78rem]">
              <thead className="sticky top-0 bg-rvl-panel font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-ink-2">
                <tr>
                  <th className="p-2">Player</th>
                  <th className="p-2">Team</th>
                  <th className="p-2">Kills</th>
                  <th className="p-2">Digs</th>
                  <th className="p-2">Ast</th>
                  <th className="p-2">Blk</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.length === 0 && preview.counts.stats > 0 ? (
                  <tr>
                    <td className="p-3 font-mono text-[0.68rem] text-rvl-ink-2" colSpan={6}>
                      {preview.counts.stats} stat rows will be imported on confirm. Game
                      matching is listed on the Games tab.
                    </td>
                  </tr>
                ) : null}
                {filteredStats.slice(0, 500).map((stat, index) => (
                  <tr
                    key={`${stat.gameKey}-${stat.playerName}-${index}`}
                    className="border-t border-rvl-line"
                  >
                    <td className="p-2">{stat.playerName}</td>
                    <td className="p-2">{stat.teamName}</td>
                    <td className="p-2">{stat.counts.spikeKills}</td>
                    <td className="p-2">{stat.counts.digs}</td>
                    <td className="p-2">{stat.counts.assists}</td>
                    <td className="p-2">{stat.counts.blocks}</td>
                  </tr>
                ))}
                {filteredStats.length === 0 ? (
                  <tr>
                    <td className="p-3 font-mono text-[0.68rem] text-rvl-ink-2" colSpan={6}>
                      No stats match these filters
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            {filteredStats.length > 500 ? (
              <p className="p-2 font-mono text-[0.62rem] text-rvl-ink-2">
                Showing first 500 of {filteredStats.length} filtered stat rows
              </p>
            ) : null}
          </TabsContent>
        ) : null}

        <TabsContent
          value="warnings"
          className="mt-0 min-h-96 flex-1 overflow-auto border border-rvl-line p-3"
        >
          {filteredWarnings.length === 0 ? (
            <p className="font-mono text-[0.72rem] text-rvl-ink-2">No warnings match</p>
          ) : (
            <ul className="space-y-1 font-mono text-[0.72rem] text-rvl-ink-2">
              {filteredWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
