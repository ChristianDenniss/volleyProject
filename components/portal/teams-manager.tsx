"use client";

import { pick, ResourceView, optionalText, type ColumnSpec, type FieldSpec } from "./resource-view";
import { TeamsSheetImport } from "./sheet-import-dialog";
import { trpc } from "@/lib/trpc";

interface Row {
  id: number;
  name: string;
  logoUrl: string | null;
  description: string | null;
  placement: string;
  seasonId: number | null;
  seasonNumber: number | null;
  playerCount: number;
  gameCount: number;
}

const COLUMNS: ColumnSpec<Row>[] = [
  { key: "name", label: "Team", render: (row) => row.name },
  {
    key: "season",
    label: "Season",
    render: (row) => (row.seasonNumber ? `Season ${row.seasonNumber}` : "-"),
  },
  { key: "placement", label: "Placement", render: (row) => row.placement },
  { key: "playerCount", label: "Players", align: "right", render: (row) => row.playerCount },
  { key: "gameCount", label: "Games", align: "right", render: (row) => row.gameCount },
];

export function TeamsManager({
  rows,
  seasons,
}: {
  rows: Row[];
  seasons: { id: number; label: string }[];
}) {
  const create = trpc.teams.create.useMutation();
  const update = trpc.teams.update.useMutation();
  const remove = trpc.teams.delete.useMutation();

  const fields: FieldSpec[] = [
    { name: "name", label: "Name", type: "text", required: true },
    {
      name: "seasonId",
      label: "Season",
      type: "select",
      options: seasons.map((season) => ({ value: String(season.id), label: season.label })),
    },
    { name: "placement", label: "Placement", type: "text", placeholder: "Didnt make playoffs" },
    { name: "logoUrl", label: "Logo URL", type: "url" },
    { name: "description", label: "Description", type: "text", placeholder: "Optional team blurb" },
  ];

  const toInput = (values: Record<string, string>) => {
    const seasonId = Number.parseInt(pick(values, "seasonId"), 10);
    return {
      name: pick(values, "name"),
      seasonId: Number.isFinite(seasonId) ? seasonId : null,
      placement: optionalText(pick(values, "placement")),
      logoUrl: optionalText(pick(values, "logoUrl")) ?? null,
      description: optionalText(pick(values, "description")) ?? null,
    };
  };

  return (
    <ResourceView<Row>
      title="team"
      rows={rows}
      columns={COLUMNS}
      fields={fields}
      extra={<TeamsSheetImport seasons={seasons} />}
      toValues={(row) => ({
        name: row.name,
        seasonId: row.seasonId ? String(row.seasonId) : "",
        placement: row.placement,
        logoUrl: row.logoUrl ?? "",
        description: row.description ?? "",
      })}
      onCreate={(values) => create.mutateAsync(toInput(values))}
      onUpdate={(id, values) => update.mutateAsync({ id: id as number, patch: toInput(values) })}
      onDelete={(id) => remove.mutateAsync({ id: id as number })}
    />
  );
}
