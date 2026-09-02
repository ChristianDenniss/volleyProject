"use client";

import { pick, ResourceView, optionalText, type ColumnSpec, type FieldSpec } from "./resource-view";
import { trpc } from "@/lib/trpc";

interface Row {
  id: number;
  name: string;
  position: string;
  teamCount: number;
  gamesPlayed: number;
}

const POSITIONS = [
  "N/A",
  "Setter",
  "Spiker",
  "Libero",
  "Defensive Specialist",
  "Pinch Server",
  "Developer",
] as const;

type Position = (typeof POSITIONS)[number];

const COLUMNS: ColumnSpec<Row>[] = [
  { key: "name", label: "Player", render: (row) => <span className="capitalize">{row.name}</span> },
  { key: "position", label: "Position", render: (row) => row.position },
  { key: "teamCount", label: "Teams", align: "right", render: (row) => row.teamCount },
  { key: "gamesPlayed", label: "Games", align: "right", render: (row) => row.gamesPlayed },
];

export function PlayersManager({ rows, teams }: { rows: Row[]; teams: string[] }) {
  const create = trpc.players.create.useMutation();
  const update = trpc.players.update.useMutation();
  const remove = trpc.players.delete.useMutation();

  const fields: FieldSpec[] = [
    { name: "name", label: "Name", type: "text", required: true },
    {
      name: "position",
      label: "Position",
      type: "select",
      required: true,
      options: POSITIONS.map((position) => ({ value: position, label: position })),
    },
    {
      name: "teamName",
      label: "Team",
      type: "select",
      options: teams.map((team) => ({ value: team, label: team })),
    },
  ];

  return (
    <ResourceView<Row>
      title="player"
      rows={rows}
      columns={COLUMNS}
      fields={fields}
      toValues={(row) => ({ name: row.name, position: row.position, teamName: "" })}
      onCreate={(values) =>
        create.mutateAsync({
          name: pick(values, "name"),
          position: pick(values, "position") as Position,
          teamName: optionalText(pick(values, "teamName")),
        })
      }
      onUpdate={(id, values) =>
        update.mutateAsync({
          id: id as number,
          patch: {
            name: pick(values, "name"),
            position: pick(values, "position") as Position,
          },
        })
      }
      onDelete={(id) => remove.mutateAsync({ id: id as number })}
    />
  );
}
