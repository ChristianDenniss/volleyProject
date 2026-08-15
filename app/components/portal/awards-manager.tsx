"use client";

import { ResourceView, optionalText, type ColumnSpec, type FieldSpec } from "./resource-view";
import { trpc } from "@/lib/trpc";

const AWARD_TYPES = [
  "MVP",
  "Best Spiker",
  "Best Server",
  "Best Blocker",
  "Best Libero",
  "Best Setter",
  "MIP",
  "Best Aper",
  "FMVP",
  "DPOS",
  "Best Receiver",
  "LuvLate Award",
] as const;

type AwardType = (typeof AWARD_TYPES)[number];

interface Row {
  id: number;
  type: string;
  description: string;
  imageUrl: string | null;
  seasonId: number;
  seasonNumber: number | null;
  players: { id: number; name: string }[];
}

const COLUMNS: ColumnSpec<Row>[] = [
  { key: "type", label: "Award", render: (row) => row.type },
  {
    key: "season",
    label: "Season",
    render: (row) => (row.seasonNumber ? `S${row.seasonNumber}` : "—"),
  },
  {
    key: "players",
    label: "Recipients",
    render: (row) => (
      <span className="capitalize">
        {row.players.map((player) => player.name).join(", ") || "unassigned"}
      </span>
    ),
  },
  { key: "description", label: "Description", render: (row) => row.description },
];

export function AwardsManager({
  rows,
  seasons,
}: {
  rows: Row[];
  seasons: { id: number; label: string }[];
}) {
  const create = trpc.awards.createWithPlayerNames.useMutation();
  const update = trpc.awards.update.useMutation();
  const remove = trpc.awards.delete.useMutation();

  const fields: FieldSpec[] = [
    {
      name: "type",
      label: "Award",
      type: "select",
      required: true,
      options: AWARD_TYPES.map((type) => ({ value: type, label: type })),
    },
    {
      name: "seasonId",
      label: "Season",
      type: "select",
      required: true,
      options: seasons.map((season) => ({ value: String(season.id), label: season.label })),
    },
    { name: "description", label: "Description", type: "text", required: true },
    {
      name: "playerNames",
      label: "Recipients",
      type: "text",
      placeholder: "comma separated player names",
    },
    { name: "imageUrl", label: "Image URL", type: "url" },
  ];

  const names = (value: string) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

  return (
    <ResourceView<Row>
      title="award"
      rows={rows}
      columns={COLUMNS}
      fields={fields}
      toValues={(row) => ({
        type: row.type,
        seasonId: String(row.seasonId),
        description: row.description,
        playerNames: row.players.map((player) => player.name).join(", "),
        imageUrl: row.imageUrl ?? "",
      })}
      onCreate={(values) =>
        create.mutateAsync({
          type: values.type as AwardType,
          seasonId: Number.parseInt(values.seasonId, 10),
          description: values.description,
          imageUrl: optionalText(values.imageUrl) ?? null,
          playerNames: names(values.playerNames),
        })
      }
      onUpdate={(id, values) =>
        update.mutateAsync({
          id: id as number,
          patch: {
            type: values.type as AwardType,
            seasonId: Number.parseInt(values.seasonId, 10),
            description: values.description,
            imageUrl: optionalText(values.imageUrl) ?? null,
          },
        })
      }
      onDelete={(id) => remove.mutateAsync({ id: id as number })}
    />
  );
}
