export interface StandingTeam {
  id: number;
  name: string;
  logoUrl: string | null;
  placement: string | null;
}

export interface StandingMatch {
  status: string;
  team1Name: string | null;
  team2Name: string | null;
  team1Score: number | null;
  team2Score: number | null;
}

export interface StandingRow extends StandingTeam {
  rank: number;
  played: number;
  wins: number;
  losses: number;
  setsFor: number;
  setsAgainst: number;
  setDiff: number;
  winPct: number;
}

export function placementRank(placement: string | null): number {
  const value = (placement ?? "").toLowerCase();
  if (/champion|\b1st\b/.test(value)) return 0;
  if (/finalist|runner|\b2nd\b/.test(value)) return 1;
  if (/semi/.test(value)) return 2;
  if (/quarter/.test(value)) return 3;
  if (/didn/.test(value)) return 5;
  return 4;
}

export function formatWinPct(wins: number, played: number) {
  if (played === 0) return "—";
  return `${Math.round((wins / played) * 100)}%`;
}

export function formatSetDiff(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function rankStandings(teams: StandingTeam[], matches: StandingMatch[]): StandingRow[] {
  const byName = new Map(
    teams.map((team) => [
      team.name,
      {
        ...team,
        played: 0,
        wins: 0,
        losses: 0,
        setsFor: 0,
        setsAgainst: 0,
      },
    ]),
  );

  for (const match of matches) {
    if (match.status !== "completed") continue;
    const home = match.team1Name ? byName.get(match.team1Name) : undefined;
    const away = match.team2Name ? byName.get(match.team2Name) : undefined;
    if (!home || !away) continue;

    const homeSets = match.team1Score ?? 0;
    const awaySets = match.team2Score ?? 0;
    home.played += 1;
    away.played += 1;
    home.setsFor += homeSets;
    home.setsAgainst += awaySets;
    away.setsFor += awaySets;
    away.setsAgainst += homeSets;

    if (homeSets === awaySets) continue;
    if (homeSets > awaySets) {
      home.wins += 1;
      away.losses += 1;
    } else {
      away.wins += 1;
      home.losses += 1;
    }
  }

  return [...byName.values()]
    .sort((left, right) => {
      if (left.played === 0 && right.played > 0) return 1;
      if (right.played === 0 && left.played > 0) return -1;

      const winGap = right.wins - left.wins;
      if (winGap !== 0) return winGap;

      const setGap = right.setsFor - right.setsAgainst - (left.setsFor - left.setsAgainst);
      if (setGap !== 0) return setGap;

      const setsForGap = right.setsFor - left.setsFor;
      if (setsForGap !== 0) return setsForGap;

      const placeGap = placementRank(left.placement) - placementRank(right.placement);
      if (placeGap !== 0) return placeGap;

      return left.name.localeCompare(right.name);
    })
    .map((team, index) => ({
      ...team,
      rank: index + 1,
      setDiff: team.setsFor - team.setsAgainst,
      winPct: team.played === 0 ? 0 : team.wins / team.played,
    }));
}
