import type { Db } from "@db";
import { insertMany } from "@db/insert";
import {
  articleLikes,
  articles,
  awards,
  awardsPlayers,
  games,
  players,
  records,
  seasons,
  stats,
  teams,
  teamsGames,
  teamsPlayers,
} from "@db/schema";
import { plainTextToDoc } from "@/lib/tiptap-doc";
import { seed } from "./seed";

const at = (iso: string) => new Date(iso);
const POSITIONS = ["Setter", "Outside", "Middle", "Libero", "Opposite"] as const;
const LOGO = "/images/rvlLogo.png";

const SEASON_3 = 3;
const SEASON_4 = 4;

const S3_TEAMS = [
  { id: 5, name: "Tide Breakers", placement: "Champion" },
  { id: 6, name: "Iron Setters", placement: "Finalist" },
  { id: 7, name: "Neon Aces", placement: "Semi-finals" },
  { id: 8, name: "Harbor Lights", placement: "Didnt make playoffs" },
] as const;

const S4_TEAMS = [
  { id: 9, name: "Volt Diggers", placement: "Finalist" },
  { id: 10, name: "Crimson Floor", placement: "Finalist" },
  { id: 11, name: "Night Owls", placement: "Semi-finals" },
  { id: 12, name: "Polar Tips", placement: "Quarter-finals" },
  { id: 13, name: "Glass Cannons", placement: "Quarter-finals" },
  { id: 14, name: "Sand Kings", placement: "Quarter-finals" },
  { id: 15, name: "Echo Block", placement: "Semi-finals" },
  { id: 16, name: "Lunar Serve", placement: "Quarter-finals" },
] as const;

const S3_PLAYERS = [
  "iris cho",
  "juno vale",
  "kai nunez",
  "lex orourke",
  "mira sol",
  "nico park",
  "ora west",
  "paz kim",
  "quin hale",
  "rio dunn",
  "slye ortiz",
  "tess kwan",
];

const S4_PLAYERS = [
  "uma reed",
  "vesper lin",
  "wren cole",
  "xan brooks",
  "yara nash",
  "zed quinn",
  "aria holt",
  "beck moss",
  "cine vaz",
  "dove rami",
  "ember cox",
  "flint okada",
  "glen perez",
  "haze nguyen",
  "indy cruz",
  "joss wei",
  "kade bloom",
  "lark singh",
  "mae frost",
  "nash ike",
  "opal drake",
  "penn yoon",
  "quill abe",
  "rory tan",
];

function story(title: string, paragraphs: string[]): string {
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: title }],
      },
      ...paragraphs.map((text) => ({
        type: "paragraph",
        content: [{ type: "text", text }],
      })),
    ],
  });
}

function line(playerId: number, gameId: number, salt: number) {
  return {
    playerId,
    gameId,
    spikeKills: 8 + ((salt * 3) % 18),
    spikeAttempts: 22 + ((salt * 5) % 24),
    spikingErrors: 1 + (salt % 5),
    apeKills: 2 + (salt % 8),
    apeAttempts: 7 + (salt % 12),
    assists: 4 + ((salt * 2) % 16),
    settingErrors: salt % 3,
    blocks: 1 + ((salt * 3) % 9),
    blockFollows: salt % 5,
    digs: 6 + ((salt * 4) % 14),
    aces: salt % 7,
    servingErrors: salt % 4,
    miscErrors: salt % 2,
  };
}

export async function seedDev(db: Db): Promise<void> {
  await seed(db);

  await insertMany(db, seasons, [
    {
      id: SEASON_3,
      seasonNumber: 3,
      startDate: "2026-06-02",
      endDate: "2026-07-28",
      theme: "Night Court",
      image: "/images/s12.png",
    },
    {
      id: SEASON_4,
      seasonNumber: 4,
      startDate: "2026-08-04",
      endDate: null,
      theme: "Floodlights",
      image: "/images/s13.png",
    },
  ]);

  await insertMany(db, teams, [
    ...S3_TEAMS.map((team) => ({
      id: team.id,
      name: team.name,
      logoUrl: LOGO,
      placement: team.placement,
      seasonId: SEASON_3,
    })),
    ...S4_TEAMS.map((team) => ({
      id: team.id,
      name: team.name,
      logoUrl: LOGO,
      placement: team.placement,
      seasonId: SEASON_4,
    })),
  ]);

  const extraPlayers = [...S3_PLAYERS, ...S4_PLAYERS];
  await insertMany(
    db,
    players,
    extraPlayers.map((name, index) => ({
      id: index + 9,
      name,
      position: POSITIONS[index % POSITIONS.length],
    })),
  );

  await insertMany(db, teamsPlayers, [
    ...S3_PLAYERS.map((_, index) => {
      const teamId = 5 + Math.floor(index / 3);
      const playerId = 9 + index;
      const seat = index % 3;
      const role = seat === 0 ? ("C" as const) : seat === 1 ? ("VC" as const) : ("CC" as const);
      return { teamId, playerId, role };
    }),
    ...S4_PLAYERS.map((_, index) => {
      const teamId = 9 + Math.floor(index / 3);
      const playerId = 21 + index;
      const seat = index % 3;
      const role = seat === 0 ? ("C" as const) : seat === 1 ? ("VC" as const) : ("CC" as const);
      return { teamId, playerId, role };
    }),
  ]);

  const s3Pairs = [
    [5, 6],
    [7, 8],
    [5, 7],
    [6, 8],
  ] as const;
  const s4Pairs = [
    [9, 10],
    [11, 12],
    [13, 14],
    [15, 16],
    [9, 11],
    [10, 12],
    [13, 15],
    [14, 16],
    [9, 13],
    [10, 14],
    [11, 15],
    [12, 16],
  ] as const;

  const teamById = new Map(
    [...S3_TEAMS, ...S4_TEAMS].map((team) => [team.id, team.name] as const),
  );
  const REGIONS = ["na", "eu", "as", "sa"] as const;
  const setLine = (a: number, b: number) => `${a}-${b}`;

  function roundFromStage(stage: string) {
    if (stage.includes("Semi")) return "Semi-Finals";
    if (stage.includes("Quarter")) return "Quarter-Finals";
    if (stage === "Finals") return "Finals";
    return "Round of 16";
  }

  function scheduleFields(stage: string, index: number) {
    const round = roundFromStage(stage);
    return {
      matchNumber: `${round} - Match ${index + 1}`,
      round,
      status: "completed" as const,
      phase: (round === "Round of 16" ? "qualifiers" : "playoffs") as "qualifiers" | "playoffs",
      region: REGIONS[index % REGIONS.length],
    };
  }

  const gameRows = [
    ...s3Pairs.map(([a, b], index) => {
      const stage = index === 3 ? "Finals" : "Winners Bracket; Round of 16";
      return {
        id: 18 + index,
        name: `${teamById.get(a)} Vs. ${teamById.get(b)}`,
        ...scheduleFields(stage, index),
        team1Score: index % 2 === 0 ? 3 : 1,
        team2Score: index % 2 === 0 ? 1 : 3,
        date: `2026-06-${String(8 + index * 7).padStart(2, "0")}`,
        stage,
        videoUrl: index === 0 ? "https://www.youtube.com/watch?v=nightcourt1" : null,
        tags: null,
        seasonId: SEASON_3,
        teamIds: [a, b] as const,
      };
    }),
    ...s4Pairs.map(([a, b], index) => {
      const stage =
        index >= 10
          ? "Finals"
          : index >= 8
            ? "Winners Bracket; Semi Finals"
            : index >= 4
              ? "Winners Bracket; Quarter Finals"
              : "Winners Bracket; Round of 16";
      return {
        id: 6 + index,
        name: `${teamById.get(a)} Vs. ${teamById.get(b)}`,
        ...scheduleFields(stage, index),
        team1Score: index % 3 === 2 ? 2 : 3,
        team2Score: index % 3 === 2 ? 3 : index % 2,
        date: `2026-08-${String(6 + index * 2).padStart(2, "0")}`,
        stage,
        videoUrl: index % 4 === 0 ? `https://www.youtube.com/watch?v=flood${index}` : null,
        tags: null,
        seasonId: SEASON_4,
        teamIds: [a, b] as const,
      };
    }),
  ];

  const teamIdByName = new Map<string, number>(
    [...S3_TEAMS, ...S4_TEAMS].map((team) => [team.name, team.id]),
  );

  const playoffGames = [
    {
      id: 22,
      matchNumber: "Quarter-Finals - Match 1",
      round: "Quarter-Finals",
      status: "completed" as const,
      phase: "playoffs" as const,
      region: "sa" as const,
      date: "2026-08-08",
      team1Name: "Echo Block",
      team2Name: "Lunar Serve",
      team1Score: 3,
      team2Score: 0,
      set1Score: setLine(25, 16),
      set2Score: setLine(25, 20),
      set3Score: setLine(25, 19),
      set4Score: null,
      set5Score: null,
      tags: ["Playoffs"],
      seasonId: SEASON_4,
    },
    {
      id: 23,
      matchNumber: "Quarter-Finals - Match 2",
      round: "Quarter-Finals",
      status: "completed" as const,
      phase: "playoffs" as const,
      region: "na" as const,
      date: "2026-08-15",
      team1Name: "Volt Diggers",
      team2Name: "Sand Kings",
      team1Score: 3,
      team2Score: 0,
      set1Score: setLine(25, 18),
      set2Score: setLine(25, 21),
      set3Score: setLine(25, 16),
      set4Score: null,
      set5Score: null,
      tags: ["Playoffs"],
      seasonId: SEASON_4,
    },
    {
      id: 24,
      matchNumber: "Quarter-Finals - Match 3",
      round: "Quarter-Finals",
      status: "completed" as const,
      phase: "playoffs" as const,
      region: "eu" as const,
      date: "2026-08-16",
      team1Name: "Night Owls",
      team2Name: "Polar Tips",
      team1Score: 3,
      team2Score: 1,
      set1Score: setLine(25, 23),
      set2Score: setLine(20, 25),
      set3Score: setLine(25, 18),
      set4Score: setLine(25, 21),
      set5Score: null,
      tags: ["Playoffs"],
      seasonId: SEASON_4,
    },
    {
      id: 25,
      matchNumber: "Quarter-Finals - Match 4",
      round: "Quarter-Finals",
      status: "completed" as const,
      phase: "playoffs" as const,
      region: "as" as const,
      date: "2026-08-17",
      team1Name: "Crimson Floor",
      team2Name: "Glass Cannons",
      team1Score: 3,
      team2Score: 1,
      set1Score: setLine(25, 19),
      set2Score: setLine(22, 25),
      set3Score: setLine(25, 21),
      set4Score: setLine(25, 18),
      set5Score: null,
      tags: ["Playoffs"],
      seasonId: SEASON_4,
    },
    {
      id: 26,
      matchNumber: "Semi-Finals - Match 1",
      round: "Semi-Finals",
      status: "completed" as const,
      phase: "playoffs" as const,
      region: "na" as const,
      date: "2026-08-23",
      team1Name: "Volt Diggers",
      team2Name: "Echo Block",
      team1Score: 3,
      team2Score: 1,
      set1Score: setLine(25, 20),
      set2Score: setLine(23, 25),
      set3Score: setLine(25, 18),
      set4Score: setLine(25, 22),
      set5Score: null,
      tags: ["Playoffs"],
      seasonId: SEASON_4,
    },
    {
      id: 27,
      matchNumber: "Semi-Finals - Match 2",
      round: "Semi-Finals",
      status: "completed" as const,
      phase: "playoffs" as const,
      region: "eu" as const,
      date: "2026-08-30",
      team1Name: "Night Owls",
      team2Name: "Crimson Floor",
      team1Score: 2,
      team2Score: 3,
      set1Score: setLine(25, 22),
      set2Score: setLine(19, 25),
      set3Score: setLine(25, 23),
      set4Score: setLine(21, 25),
      set5Score: setLine(13, 15),
      tags: ["Playoffs"],
      seasonId: SEASON_4,
    },
    {
      id: 28,
      matchNumber: "Third Place - Match 1",
      round: "Third Place",
      status: "scheduled" as const,
      phase: "playoffs" as const,
      region: "as" as const,
      date: "2026-09-05",
      team1Name: "Echo Block",
      team2Name: "Night Owls",
      team1Score: null,
      team2Score: null,
      tags: ["Playoffs"],
      seasonId: SEASON_4,
    },
    {
      id: 29,
      matchNumber: "Finals - Match 1",
      round: "Finals",
      status: "scheduled" as const,
      phase: "playoffs" as const,
      region: "na" as const,
      date: "2026-09-06",
      team1Name: "Volt Diggers",
      team2Name: "Crimson Floor",
      team1Score: null,
      team2Score: null,
      tags: ["Finals", "Floodlights"],
      seasonId: SEASON_4,
    },
    {
      id: 30,
      matchNumber: "Night Court Final",
      round: "Finals",
      status: "completed" as const,
      phase: "playoffs" as const,
      region: "na" as const,
      date: "2026-07-26",
      team1Name: "Tide Breakers",
      team2Name: "Iron Setters",
      team1Score: 3,
      team2Score: 2,
      set1Score: setLine(25, 23),
      set2Score: setLine(22, 25),
      set3Score: setLine(25, 20),
      set4Score: setLine(21, 25),
      set5Score: setLine(15, 11),
      tags: ["Night Court"],
      seasonId: SEASON_3,
    },
  ].map(({ team1Name, team2Name, ...fixture }) => ({
    ...fixture,
    name: `${team1Name} Vs. ${team2Name}`,
    stage: fixture.round,
    videoUrl: null,
    teamIds: [teamIdByName.get(team1Name)!, teamIdByName.get(team2Name)!] as const,
  }));

  const densityDays = [
    { date: "2026-08-29", count: 1 },
    { date: "2026-08-31", count: 2 },
    { date: "2026-09-01", count: 3 },
    { date: "2026-09-02", count: 4 },
    { date: "2026-09-03", count: 5 },
    { date: "2026-09-04", count: 6 },
    { date: "2026-09-07", count: 2 },
    { date: "2026-09-08", count: 5 },
    { date: "2026-09-10", count: 3 },
    { date: "2026-09-12", count: 1 },
  ] as const;
  const densityPairs = [
    [9, 10],
    [11, 12],
    [13, 14],
    [15, 16],
    [9, 11],
    [10, 12],
    [13, 15],
    [14, 16],
    [9, 13],
    [10, 14],
    [11, 15],
    [12, 16],
    [9, 14],
    [10, 15],
    [11, 16],
    [12, 13],
    [9, 12],
    [10, 13],
    [11, 14],
    [15, 16],
    [9, 16],
    [10, 11],
    [12, 14],
    [13, 16],
    [9, 15],
    [10, 16],
    [11, 13],
    [12, 15],
    [14, 9],
    [13, 10],
    [16, 12],
    [15, 13],
  ] as const;

  let densityId = 31;
  let densityPair = 0;
  const densityGames = densityDays.flatMap(({ date, count }) =>
    Array.from({ length: count }, (_, index) => {
      const [a, b] = densityPairs[densityPair % densityPairs.length]!;
      densityPair += 1;
      const id = densityId;
      densityId += 1;
      const scheduled = date >= "2026-09-04";
      return {
        id,
        name: `${teamById.get(a)} Vs. ${teamById.get(b)}`,
        matchNumber: `Weeknight - Match ${index + 1}`,
        round: "Weeknight",
        status: (scheduled ? "scheduled" : "completed") as "scheduled" | "completed",
        phase: "qualifiers" as const,
        region: REGIONS[index % REGIONS.length],
        team1Score: scheduled ? null : index % 2 === 0 ? 3 : 1,
        team2Score: scheduled ? null : index % 2 === 0 ? 1 : 3,
        set1Score: scheduled ? null : setLine(25, 20 + (index % 4)),
        set2Score: scheduled ? null : setLine(22 + (index % 3), 25),
        set3Score: scheduled ? null : setLine(25, 18 + (index % 5)),
        date,
        stage: "Weeknight",
        videoUrl: null,
        tags: ["Weeknight"],
        seasonId: SEASON_4,
        teamIds: [a, b] as const,
      };
    }),
  );

  const allGames = [...gameRows, ...playoffGames, ...densityGames];

  await insertMany(
    db,
    games,
    allGames.map(({ teamIds: _teamIds, ...game }) => game),
  );
  await insertMany(
    db,
    teamsGames,
    allGames.flatMap((game) =>
      game.teamIds.map((teamId, index) => ({ gameId: game.id, slot: index + 1, teamId })),
    ),
  );

  const roster = new Map<number, number[]>();
  S3_PLAYERS.forEach((_, index) => {
    const teamId = 5 + Math.floor(index / 3);
    roster.set(teamId, [...(roster.get(teamId) ?? []), 9 + index]);
  });
  S4_PLAYERS.forEach((_, index) => {
    const teamId = 9 + Math.floor(index / 3);
    roster.set(teamId, [...(roster.get(teamId) ?? []), 21 + index]);
  });

  const statRows = allGames
    .filter((game) => game.status === "completed")
    .flatMap((game) =>
      game.teamIds.flatMap((teamId, side) =>
        (roster.get(teamId) ?? []).map((playerId, seat) =>
          line(playerId, game.id, game.id * 5 + side * 11 + seat * 3),
        ),
      ),
    );
  await insertMany(db, stats, statRows);

  await insertMany(db, awards, [
    {
      id: 3,
      type: "MVP",
      description: "Ran Night Court from the four.",
      imageUrl: "/images/awards/mvp.png",
      seasonId: SEASON_3,
    },
    {
      id: 4,
      type: "Best Spiker",
      description: "Highest kill efficiency in Night Court.",
      imageUrl: "/images/awards/best-spiker.png",
      seasonId: SEASON_3,
    },
    {
      id: 5,
      type: "Best Libero",
      description: "Kept every ball alive on the dark court.",
      imageUrl: "/images/s6.png",
      seasonId: SEASON_3,
    },
    {
      id: 6,
      type: "MVP",
      description: "The Floodlights season belongs to them.",
      imageUrl: "/images/awards/mvp.png",
      seasonId: SEASON_4,
    },
    {
      id: 7,
      type: "Best Setter",
      description: "Cleanest hands under the new lights.",
      imageUrl: "/images/awards/best-setter.png",
      seasonId: SEASON_4,
    },
    {
      id: 8,
      type: "Best Server",
      description: "Aces in bunches all summer.",
      imageUrl: "/images/awards/best-server.png",
      seasonId: SEASON_4,
    },
    {
      id: 9,
      type: "FMVP",
      description: "Closed the final in five.",
      imageUrl: "/images/awards/fmvp.png",
      seasonId: SEASON_4,
    },
    {
      id: 10,
      type: "LuvLate Award",
      description: "The clip of the season.",
      imageUrl: "/images/awards/community-recognition.png",
      seasonId: SEASON_4,
    },
    {
      id: 11,
      type: "MIP",
      description: "Biggest jump from last season to this one.",
      imageUrl: "/images/awards/mip.png",
      seasonId: SEASON_4,
    },
    {
      id: 12,
      type: "Best Aper",
      description: "Lived at the net and finished every dump.",
      imageUrl: "/images/awards/best-aper.png",
      seasonId: SEASON_4,
    },
    {
      id: 13,
      type: "DPOS",
      description: "The floor never stayed open for long.",
      imageUrl: "/images/awards/dpos.png",
      seasonId: SEASON_4,
    },
    {
      id: 14,
      type: "Best Receiver",
      description: "First contact stayed in system all year.",
      imageUrl: "/images/awards/best-receiver.png",
      seasonId: SEASON_4,
    },
    {
      id: 15,
      type: "Best Blocker",
      description: "Took away the pin and the pipe.",
      imageUrl: "/images/awards/best-blocker.png",
      seasonId: SEASON_4,
    },
  ]);

  await insertMany(db, awardsPlayers, [
    { awardId: 3, playerId: 9 },
    { awardId: 4, playerId: 11 },
    { awardId: 5, playerId: 16 },
    { awardId: 6, playerId: 21 },
    { awardId: 7, playerId: 24 },
    { awardId: 8, playerId: 27 },
    { awardId: 9, playerId: 21 },
    { awardId: 10, playerId: 33 },
    { awardId: 11, playerId: 22 },
    { awardId: 12, playerId: 25 },
    { awardId: 13, playerId: 26 },
    { awardId: 14, playerId: 28 },
    { awardId: 15, playerId: 29 },
  ]);

  const recordHolders = [21, 22, 24, 27, 29, 31, 33, 36] as const;
  const gameRecords = [
    ["total kills", [42, 39, 37, 35, 34]],
    ["blocks", [14, 13, 12, 11, 10]],
    ["aces", [9, 8, 7, 7, 6]],
    ["assists", [31, 28, 26]],
    ["digs", [29, 27, 24]],
  ] as const;
  const seasonRecords = [
    ["total kills", [186, 174, 161]],
    ["spike kills", [142, 133, 128]],
    ["spiking percentage", [48.2, 46.1, 44.7]],
  ] as const;

  let recordId = 4;
  const recordRows: Array<{
    id: number;
    metric: (typeof gameRecords)[number][0] | (typeof seasonRecords)[number][0];
    minAttempts: number | null;
    type: "game" | "season";
    rank: number;
    value: number;
    date: string | null;
    seasonId: number;
    playerId: number;
    gameId: number | null;
  }> = [];
  for (const [metric, values] of gameRecords) {
    values.forEach((value, index) => {
      recordRows.push({
        id: recordId++,
        metric,
        minAttempts: null,
        type: "game" as const,
        rank: index + 1,
        value,
        date: `2026-08-${String(10 + index).padStart(2, "0")}`,
        seasonId: SEASON_4,
        playerId: recordHolders[index] ?? 21,
        gameId: 6 + index,
      });
    });
  }
  for (const [metric, values] of seasonRecords) {
    values.forEach((value, index) => {
      recordRows.push({
        id: recordId++,
        metric,
        minAttempts: metric === "spiking percentage" ? 10 : null,
        type: "season" as const,
        rank: index + 1,
        value,
        date: null,
        seasonId: SEASON_4,
        playerId: recordHolders[index] ?? 21,
        gameId: null,
      });
    });
  }
  await insertMany(db, records, recordRows);

  await insertMany(db, articles, [
    {
      id: 3,
      title: "Night Court closes in five",
      summary: "Tide Breakers steal the last set and the trophy under the black lights.",
      content: story("A final that would not end", [
        "Harbor packed the stands for a five-set grind that felt like it belonged in a later season.",
        "Iris Cho ran the offense until the last rotation, then let Juno Vale close on the pipe.",
        "Iron Setters had match point twice. They will be back. The desk already has the clip.",
      ]),
      imageUrl: "/images/s12.png",
      approved: true,
      likes: 18,
      authorId: "fixture-admin",
      createdAt: at("2026-07-27T02:10:00Z"),
      updatedAt: at("2026-07-27T02:10:00Z"),
    },
    {
      id: 4,
      title: "Floodlights open with a statement",
      summary: "Volt Diggers sweep Sand Kings and book a semi.",
      content: story("The lights stay on", [
        "Season four's quarter-finals opened the way the preview said they would: loud, short, and one-sided.",
        "Uma Reed put up 28 kills. The block held on the second sideout after the timeout.",
        "Sand Kings never found a sideout run. Volt wait in the last four.",
      ]),
      imageUrl: "/images/top-10-wing-spikers.jpg",
      approved: true,
      likes: 27,
      authorId: "fixture-admin",
      createdAt: at("2026-08-07T01:40:00Z"),
      updatedAt: at("2026-08-07T01:40:00Z"),
    },
    {
      id: 5,
      title: "How Night Owls survived Europe",
      summary: "Four sets against Polar Tips and a ticket to the last four.",
      content: story("One more swing", [
        "Polar Tips stole the second set. Ember Cox put the next two away from the pipe.",
        "That is the Night Owls season in miniature: late, loud, and a little bit lucky.",
      ]),
      imageUrl: "/images/s9.png",
      approved: true,
      likes: 11,
      authorId: "fixture-user",
      createdAt: at("2026-08-08T19:00:00Z"),
      updatedAt: at("2026-08-08T19:00:00Z"),
    },
    {
      id: 6,
      title: "The libero watch list",
      summary: "Four names the desk cannot stop clipping as playoffs start.",
      content: story("Hands first", [
        "Mae Frost is the obvious one. The other three are quieter and maybe more dangerous.",
        "If you only watch the highlights you will miss the digs that start the points.",
      ]),
      imageUrl: "/images/s6.png",
      approved: true,
      likes: 9,
      authorId: "fixture-admin",
      createdAt: at("2026-08-14T16:20:00Z"),
      updatedAt: at("2026-08-14T16:20:00Z"),
    },
    {
      id: 7,
      title: "Crimson Floor punch through Asia",
      summary: "Glass Cannons had the highlight. Crimson Floor had the scoreboard.",
      content: story("Ugly and enough", [
        "Four sets, one timeout that actually worked, and a serve that kept leaking long until it didn't.",
        "The other half of the bracket now runs through a team a lot of previews buried.",
      ]),
      imageUrl: "/images/s5.png",
      approved: true,
      likes: 14,
      authorId: "fixture-admin",
      createdAt: at("2026-08-09T22:05:00Z"),
      updatedAt: at("2026-08-09T22:05:00Z"),
    },
    {
      id: 8,
      title: "Playoff week is here",
      summary: "The final is set: Volt Diggers against Crimson Floor. Third place is Saturday.",
      content: story("What still matters", [
        "Both semis are in the book. Volt closed Echo Block in four. Crimson Floor stole the fifth from Night Owls.",
        "The Floodlights trophy is still on the table. Come back after Sunday.",
      ]),
      imageUrl: "/images/recGfx.png",
      approved: true,
      likes: 22,
      authorId: "fixture-admin",
      createdAt: at("2026-09-01T15:00:00Z"),
      updatedAt: at("2026-09-01T15:00:00Z"),
    },
    {
      id: 9,
      title: "Unsigned notes from the booth",
      summary: "A pending desk piece that should not appear on the public list.",
      content: JSON.stringify(plainTextToDoc("This one is still in review and should stay off the homepage.")),
      imageUrl: "/images/s3.png",
      approved: null,
      likes: 0,
      authorId: "fixture-user",
      createdAt: at("2026-09-02T12:00:00Z"),
      updatedAt: at("2026-09-02T12:00:00Z"),
    },
  ]);

  await insertMany(db, articleLikes, [
    { articleId: 4, userId: "fixture-user" },
    { articleId: 4, userId: "fixture-admin" },
    { articleId: 8, userId: "fixture-user" },
    { articleId: 3, userId: "fixture-user" },
  ]);
}
