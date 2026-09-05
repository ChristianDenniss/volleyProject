import { describe, expect, it } from "vitest";
import { parseSheetNamesFromHtml } from "@server/services/sheet-import/fetch";
import { matchStatsToGames, mergeTeamRosters, rosterSizeWarnings } from "@server/services/sheet-import/match";
import { displayName, normalizeName, parseTeamHeader } from "@server/services/sheet-import/names";
import { parseMasterScheduleTab, parseMasterTeamsTab } from "@server/services/sheet-import/parse-master";
import { parseRegionalPlayersLeaderboard, parseRegionalTeamTab, parseRegionalWorkbook } from "@server/services/sheet-import/parse-regional";
import type { ParsedGame, ParsedScoreBlock } from "@server/services/sheet-import/types";
import {
  importKeyFromStoredGame,
  masterGameKey,
  syntheticGameKey,
} from "@server/services/sheet-import/keys";

describe("import game keys", () => {
  it("builds stable master and synthetic keys", () => {
    expect(masterGameKey("na", "qualifiers", "Teiko", "Tenjiku", 3, 1, "Round 1")).toBe(
      "na|qualifiers|Round 1|teiko|tenjiku|3-1",
    );
    expect(syntheticGameKey("eu", "Night Owls", "Polar Tips", 3, 2)).toBe(
      "eu|stats|night owls|polar tips|3-2",
    );
  });

  it("reconstructs stored synthetic game keys", () => {
    expect(
      importKeyFromStoredGame({
        region: "na",
        phase: "playoffs",
        round: "From stats sheet",
        date: "1970-01-01",
        team1Name: "Teiko",
        team2Name: "Tenjiku",
        team1Score: 3,
        team2Score: 1,
      }),
    ).toBe("na|stats|teiko|tenjiku|3-1");
  });
});

describe("parseSheetNamesFromHtml", () => {
  it("reads items.push name entries from public htmlview", () => {
    const html = `
      items.push({name: "MAIN TAB", pageUrl: "https:\\/\\/docs.google.com\\/spreadsheets\\/d\\/abc\\/htmlview", gid: "0"});
      items.push({name: "NA TEAMS", pageUrl: "https:\\/\\/docs.google.com\\/spreadsheets\\/d\\/abc\\/htmlview", gid: "1"});
      items.push({name: "NA QUALIFIERS", pageUrl: "https:\\/\\/docs.google.com\\/spreadsheets\\/d\\/abc\\/htmlview", gid: "2"});
    `;
    expect(parseSheetNamesFromHtml(html)).toEqual(["MAIN TAB", "NA TEAMS", "NA QUALIFIERS"]);
  });
});

describe("sheet-import names", () => {
  it("normalizes emoji and punctuation from team names", () => {
    expect(normalizeName("Tenjiku ??")).toBe("tenjiku");
    expect(displayName("Tenjiku ??")).toBe("Tenjiku");
  });

  it("parses team headers with pipe rankings", () => {
    expect(parseTeamHeader("Teiko | 143 C VC")).toBe("Teiko");
    expect(parseTeamHeader("SSS | 220 C VC")).toBe("SSS");
    expect(parseTeamHeader("not a header")).toBeNull();
    expect(parseTeamHeader("SEASON I - N.A TEAMS 00 | 112 C VC")).toBeNull();
    expect(parseTeamHeader("SEASON I - EU TEAMS Kaka | 11 C VC")).toBe("Kaka");
  });
});

describe("parseMasterTeamsTab", () => {
  it("extracts teams and roster names from master TEAMS layout", () => {
    const csv = [
      `"","Group A","","Aura | 43 C VC","captain_one  captain_two","","Teiko | 12 C VC","ace_one"`,
      `"","","","4","roster_a","","4","roster_b"`,
      `"","","","5","roster_c","","5","roster_d"`,
    ].join("\n");

    const { teams } = parseMasterTeamsTab(csv, "na");
    const names = teams.map((team) => team.name).sort();
    expect(names).toEqual(["Aura", "Teiko"]);
    const teiko = teams.find((team) => team.name === "Teiko");
    expect(teiko?.playerNames).toEqual(expect.arrayContaining(["ace_one", "roster_b", "roster_d"]));
    expect(teiko?.leadership).toEqual({ C: "ace_one" });
    const aura = teams.find((team) => team.name === "Aura");
    expect(aura?.leadership).toEqual({ C: "captain_one", VC: "captain_two" });
  });

  it("maps a third header captain as CC", () => {
    const csv = [`"","Group A","","Aura | 43 C VC VC","cap_a  cap_b  cap_c"`].join("\n");
    const { teams } = parseMasterTeamsTab(csv, "na");
    expect(teams[0]?.leadership).toEqual({ C: "cap_a", VC: "cap_b", CC: "cap_c" });
  });

  it("does not leak later group rosters into earlier team columns", () => {
    const csv = [
      `"","Group A","","sp8der | 347 C VC","cap_a cap_b","","Seirin | 100 C VC","s1"`,
      `"","","","4","seqynce","","","4","s2"`,
      `"","","","5","Far3on012","","","5","s3"`,
      `"","Group B"`,
      `"","","","4","LyWeiss","","","4","other_team_player"`,
      `"","","","5","zkiiino","","","5","another"`,
    ].join("\n");

    const { teams, warnings } = parseMasterTeamsTab(csv, "eu");
    const sp8 = teams.find((team) => team.name === "sp8der");
    expect(sp8?.playerNames).toEqual(
      expect.arrayContaining(["cap_a", "cap_b", "seqynce", "Far3on012"]),
    );
    expect(sp8?.playerNames).not.toContain("LyWeiss");
    expect(sp8?.playerNames).not.toContain("zkiiino");
    expect(sp8?.playerNames.length).toBeLessThanOrEqual(6);
    expect(warnings.some((warning) => /later groups/i.test(warning))).toBe(true);
  });
});

describe("mergeTeamRosters", () => {
  it("prefers non-empty regional roster over master", () => {
    const merged = mergeTeamRosters(
      [{ name: "sp8der", region: "eu", playerNames: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"] }],
      [{ name: "sp8der", region: "eu", playerNames: ["2lostt", "9expi"] }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.playerNames).toEqual(["2lostt", "9expi"]);
  });

  it("keeps master captaincy when regional replaces the roster", () => {
    const merged = mergeTeamRosters(
      [
        {
          name: "Aura",
          region: "na",
          playerNames: ["Panchoxddd12", "Enz0Gamer_playyy", "sreggow", "extra"],
          leadership: { C: "Panchoxddd12", VC: "Enz0Gamer_playyy", CC: "sreggow" },
        },
      ],
      [{ name: "Aura", region: "na", playerNames: ["roster_a", "roster_b", "panchoxddd12"] }],
    );
    expect(merged[0]?.leadership).toEqual({
      C: "Panchoxddd12",
      VC: "Enz0Gamer_playyy",
      CC: "sreggow",
    });
    // Captains missing from regional are forced back onto the roster.
    expect(merged[0]?.playerNames.map((name) => name.toLowerCase())).toEqual(
      expect.arrayContaining(["panchoxddd12", "enz0gamer_playyy", "sreggow", "roster_a", "roster_b"]),
    );
  });
});

describe("rosterSizeWarnings", () => {
  it("flags oversized and tiny rosters without treating empty as an error", () => {
    const warnings = rosterSizeWarnings([
      { name: "sp8der", region: "eu", playerNames: Array.from({ length: 46 }, (_, i) => `p${i}`) },
      { name: "Tiny", region: "na", playerNames: ["only"] },
      { name: "Ok", region: "as", playerNames: ["a", "b", "c", "d", "e", "f"] },
      { name: "Empty", region: "na", playerNames: [] },
    ]);
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toMatch(/sp8der.*46 players/);
    expect(warnings[1]).toMatch(/Tiny.*only 1 player/);
  });
});

describe("parseMasterScheduleTab", () => {
  it("parses qualifier match rows and marks forfeits", () => {
    const csv = [
      `"","Match","","","","Schedule","","Referee(s)","","Score"`,
      `"NA ROUND ONE","Aura","2","0","GENG","Jan 10 [Saturday]","8:00 PM EST","ref1","","25 - 20","25 - 18"`,
      `"","SSJ","2","0","Mambas","Jan 10 [Saturday]","5:00 PM EST","N/A","","Forfeit"`,
    ].join("\n");

    const { games } = parseMasterScheduleTab(csv, "na", "qualifiers", 2026);
    expect(games.length).toBe(2);
    expect(games[0]?.team1Name).toBe("Aura");
    expect(games[0]?.team2Name).toBe("GENG");
    expect(games[0]?.team1Score).toBe(2);
    expect(games[0]?.date).toBe("2026-01-10");
    expect(games[1]?.forfeit).toBe(true);
  });

  it("skips zero-set playoff rows and reads real set totals", () => {
    const csv = [
      `"","Losers Finals","","TT9","0","0"`,
      `"","Losers Finals","","0 0","0","0"`,
      `"","Grand-Finals","","TT9","25","25"`,
      `"","Grand-Finals","","0 0","20","18"`,
    ].join("\n");

    const { games } = parseMasterScheduleTab(csv, "na", "playoffs", 2026);
    expect(games.every((game) => (game.team1Score ?? 0) + (game.team2Score ?? 0) > 0)).toBe(true);
    const tt9 = games.find(
      (game) =>
        (game.team1Name === "TT9" && game.team2Name === "0 0") ||
        (game.team2Name === "TT9" && game.team1Name === "0 0"),
    );
    expect(tt9).toBeDefined();
    const tt9Sets = tt9!.team1Name === "TT9" ? tt9!.team1Score : tt9!.team2Score;
    const zeroSets = tt9!.team1Name === "0 0" ? tt9!.team1Score : tt9!.team2Score;
    expect(tt9Sets).toBe(2);
    expect(zeroSets).toBe(0);
  });
});

describe("parseRegionalTeamTab", () => {
  it("reads roster totals and per-game score blocks", () => {
    const csv = [
      `"Teiko Players","Ape Errors","Ape Kills","Ape Attempts","Ape FG%","Spiking Errors","Kills","Attempts","Kill FG%","Total Kills","Total Attempts","Total FG%","Total Blocks","Kill Blocks","Soft Blocks","One Touches","Assists","Total Receives","Digs","BFs","Aces","Total Errors","Misc. Errors","Set. Errors","Serve Errors"`,
      `"ardxthya","0","2","10","20%","1","5","20","25%","7","30","23%","1","1","0","0","3","10","8","2","1","1","1","0","0"`,
      `"TOTAL:","0","2","10","","1","5","20","","7","30","","1","1","0","0","3","10","8","2","1","1","1","0","0"`,
      `"Score: 2-0 Teiko"`,
      `"Players"`,
      `"Teiko"`,
      `"ardxthya","0","1","4","25%","0","3","10","30%","4","14","28%","0","0","0","0","2","5","4","1","0","0","0","0","0"`,
      `"TOTAL:","0","1","4","","0","3","10","","4","14","","0","0","0","0","2","5","4","1","0","0","0","0","0"`,
      `"Score: 1-3 Tenjiku"`,
      `"Players"`,
      `"Teiko"`,
      `"ardxthya","0","0","2","0%","1","1","8","12%","1","10","10%","1","1","0","0","0","6","5","1","0","1","1","0","0"`,
      `"TOTAL:","0","0","2","","1","1","8","","1","10","","1","1","0","0","0","6","5","1","0","1","1","0","0"`,
    ].join("\n");

    const { team, blocks } = parseRegionalTeamTab("Teiko", csv, "na");
    expect(team.playerNames).toContain("ardxthya");
    expect(blocks.length).toBe(2);
    expect(blocks[0]?.winnerName).toBe("Teiko");
    expect(blocks[0]?.teamScore).toBe(2);
    expect(blocks[1]?.winnerName).toBe("Tenjiku");
    expect(blocks[1]?.rows[0]?.spikeKills).toBe(1);
  });

  it("falls back to the PLAYERS tab when a team sheet is an empty playoff shell", () => {
    const playersCsv = [
      `"","PLAYERS","TEAM"`,
      `"1","ace_one","SSJ"`,
      `"2","ace_two","SSJ"`,
    ].join("\n");

    const emptyTeamCsv = [
      `"SSJ Players SSJ","Ape Kills","Kills"`,
      `"","0","0"`,
      `"Score: 0-2 TT9"`,
    ].join("\n");

    const tabs = new Map<string, string[]>([
      ["PLAYERS", playersCsv.split("\n")],
      ["SSJ", emptyTeamCsv.split("\n")],
    ]);

    const { teams, warnings } = parseRegionalWorkbook(tabs, "na");
    const ssj = teams.find((team) => team.name === "SSJ");
    expect(ssj?.playerNames).toEqual(["ace_one", "ace_two"]);
    expect(warnings.some((warning) => /No players found.*SSJ/.test(warning))).toBe(false);
  });

  it("reads the PLAYERS leaderboard into a team map", () => {
    const csv = [
      `"","PLAYER LEADERBOARD","TEAM"`,
      `"1","m_ochii3","Inter Milan"`,
      `"2","Glorry_Me","LUCIO"`,
    ].join("\n");

    const map = parseRegionalPlayersLeaderboard(csv);
    expect(map.get("inter milan")).toEqual(["m_ochii3"]);
    expect(map.get("lucio")).toEqual(["Glorry_Me"]);
  });
});

describe("matchStatsToGames", () => {
  it("attaches score-block stats to matching master games", () => {
    const games: ParsedGame[] = [
      {
        key: "g1",
        region: "na",
        phase: "playoffs",
        round: "R1",
        date: "2026-06-01",
        team1Name: "Teiko",
        team2Name: "Tenjiku",
        team1Score: 1,
        team2Score: 3,
        setScores: [],
        forfeit: false,
      },
    ];

    const blocks: ParsedScoreBlock[] = [
      {
        teamName: "Teiko",
        region: "na",
        winnerName: "Tenjiku",
        teamScore: 1,
        opponentScore: 3,
        rows: [
          {
            playerName: "ardxthya",
            spikeKills: 1,
            spikeAttempts: 8,
            spikingErrors: 1,
            apeKills: 0,
            apeAttempts: 2,
            assists: 0,
            settingErrors: 0,
            blocks: 1,
            blockFollows: 1,
            digs: 5,
            aces: 0,
            servingErrors: 0,
            miscErrors: 1,
          },
        ],
      },
    ];

    const matched = matchStatsToGames(games, blocks);
    expect(matched.stats).toHaveLength(1);
    expect(matched.stats[0]?.gameKey).toBe("g1");
    expect(matched.warnings).toHaveLength(0);
  });

  it("warns on unmatched score blocks", () => {
    const matched = matchStatsToGames([], [
      {
        teamName: "Teiko",
        region: "na",
        winnerName: "Teiko",
        teamScore: 2,
        opponentScore: 0,
        rows: [],
      },
    ]);
    expect(matched.warnings[0]).toMatch(/Unmatched score block/);
  });

  it("relaxes to the only schedule row for a team pair when set totals disagree", () => {
    const games: ParsedGame[] = [
      {
        key: "g1",
        region: "eu",
        phase: "playoffs",
        round: "Finals",
        date: "2026-06-01",
        team1Name: "Imperial",
        team2Name: "Seirin",
        team1Score: 0,
        team2Score: 0,
        setScores: [],
        forfeit: false,
      },
    ];

    const blocks: ParsedScoreBlock[] = [
      {
        teamName: "Seirin",
        region: "eu",
        winnerName: "Imperial",
        teamScore: 0,
        opponentScore: 2,
        rows: [
          {
            playerName: "ace",
            spikeKills: 4,
            spikeAttempts: 10,
            spikingErrors: 0,
            apeKills: 0,
            apeAttempts: 0,
            assists: 1,
            settingErrors: 0,
            blocks: 0,
            blockFollows: 0,
            digs: 2,
            aces: 0,
            servingErrors: 0,
            miscErrors: 0,
          },
        ],
      },
    ];

    const matched = matchStatsToGames(games, blocks);
    expect(matched.stats).toHaveLength(1);
    expect(matched.warnings).toHaveLength(0);
  });

  it("synthesizes a schedule row from a stats block when the bracket omitted the match", () => {
    const matched = matchStatsToGames([], [
      {
        teamName: "0 0",
        region: "na",
        winnerName: "TT9",
        teamScore: 0,
        opponentScore: 2,
        rows: [
          {
            playerName: "ace",
            spikeKills: 1,
            spikeAttempts: 4,
            spikingErrors: 0,
            apeKills: 0,
            apeAttempts: 0,
            assists: 0,
            settingErrors: 0,
            blocks: 0,
            blockFollows: 0,
            digs: 1,
            aces: 0,
            servingErrors: 0,
            miscErrors: 0,
          },
        ],
      },
    ]);
    expect(matched.syntheticGames).toHaveLength(1);
    expect(matched.syntheticGames[0]?.team2Name).toBe("TT9");
    expect(matched.stats).toHaveLength(1);
    expect(matched.warnings).toHaveLength(0);
  });
});
