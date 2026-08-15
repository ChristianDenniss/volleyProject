"use client";

import { ResourceView, optionalText, type ColumnSpec, type FieldSpec } from "./resource-view";
import { trpc } from "@/lib/trpc";

interface Row {
  id: number;
  name: string | null;
  date: string;
  stage: string;
  team1Score: number;
  team2Score: number;
  seasonNumber: number | null;
  teams: { id: number; name: string }[];
}

const COLUMNS: ColumnSpec<Row>[] = [
  {
    key: "name",
    label: "Game",
    render: (row) => row.name ?? row.teams.map((team) => team.name).join(" Vs. "),
  },
  { key: "date", label: "Date", render: (row) => row.date },
  {
    key: "season",
    label: "Season",
    render: (row) => (row.seasonNumber ? `S${row.seasonNumber}` : "—"),
  },
  { key: "stage", label: "Stage", render: (row) => row.stage },
  {
    key: "score",
    label: "Score",
    align: "right",
    render: (row) => `${row.team1Score} – ${row.team2Score}`,
  },
];

export function GamesManager({
  rows,
  seasons,
  teams,
}: {
  rows: Row[];
  seasons: { id: number; label: string }[];
  teams: string[];
}) {
  const create = trpc.games.createByNames.useMutation();
  const update = trpc.games.update.useMutation();
  const remove = trpc.games.delete.useMutation();

  const teamOptions = teams.map((team) => ({ value: team, label: team }));

  const fields: FieldSpec[] = [
    { name: "date", label: "Date", type: "date", required: true },
    {
      name: "seasonId",
      label: "Season",
      type: "select",
      required: true,
      options: seasons.map((season) => ({ value: String(season.id), label: season.label })),
    },
    { name: "team1", label: "Team 1", type: "select", required: true, options: teamOptions },
    { name: "team2", label: "Team 2", type: "select", required: true, options: teamOptions },
    { name: "team1Score", label: "Team 1 score", type: "number", required: true },
    { name: "team2Score", label: "Team 2 score", type: "number", required: true },
    { name: "stage", label: "Stage", type: "text" },
    { name: "videoUrl", label: "Video URL", type: "url" },
  ];

  return (
    <ResourceView<Row>
      title="game"
      rows={rows}
      columns={COLUMNS}
      fields={fields}
      toValues={(row) => ({
        date: row.date,
        seasonId: "",
        team1: row.teams[0]?.name ?? "",
        team2: row.teams[1]?.name ?? "",
        team1Score: String(row.team1Score),
        team2Score: String(row.team2Score),
        stage: row.stage,
        videoUrl: "",
      })}
      onCreate={(values) =>
        create.mutateAsync({
          date: values.date,
          seasonId: Number.parseInt(values.seasonId, 10),
          teamNames: [values.team1, values.team2],
          team1Score: Number.parseInt(values.team1Score, 10),
          team2Score: Number.parseInt(values.team2Score, 10),
          stage: optionalText(values.stage),
          videoUrl: optionalText(values.videoUrl) ?? null,
        })
      }
      onUpdate={(id, values) =>
        update.mutateAsync({
          id: id as number,
          patch: {
            date: values.date,
            team1Score: Number.parseInt(values.team1Score, 10),
            team2Score: Number.parseInt(values.team2Score, 10),
            stage: optionalText(values.stage),
            videoUrl: optionalText(values.videoUrl) ?? null,
          },
        })
      }
      onDelete={(id) => remove.mutateAsync({ id: id as number })}
    />
  );
}
