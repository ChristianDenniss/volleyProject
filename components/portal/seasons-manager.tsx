"use client";

import { pick, ResourceView, optionalText, type ColumnSpec, type FieldSpec } from "./resource-view";
import { trpc } from "@/lib/trpc";

interface Row {
  id: number;
  seasonNumber: number;
  startDate: string;
  endDate: string | null;
  theme: string | null;
  teamCount: number;
  gameCount: number;
}

const FIELDS: FieldSpec[] = [
  { name: "seasonNumber", label: "Season number", type: "number", required: true },
  { name: "startDate", label: "Start date", type: "date", required: true },
  { name: "endDate", label: "End date", type: "date" },
  { name: "theme", label: "Theme", type: "text" },
  { name: "image", label: "Image URL", type: "url" },
];

const COLUMNS: ColumnSpec<Row>[] = [
  { key: "seasonNumber", label: "Season", render: (row) => `Season ${row.seasonNumber}` },
  { key: "theme", label: "Theme", render: (row) => row.theme ?? "—" },
  { key: "startDate", label: "Start", render: (row) => row.startDate },
  { key: "endDate", label: "End", render: (row) => row.endDate ?? "in progress" },
  { key: "teamCount", label: "Teams", align: "right", render: (row) => row.teamCount },
  { key: "gameCount", label: "Games", align: "right", render: (row) => row.gameCount },
];

export function SeasonsManager({ rows }: { rows: Row[] }) {
  const create = trpc.seasons.create.useMutation();
  const update = trpc.seasons.update.useMutation();
  const remove = trpc.seasons.delete.useMutation();

  return (
    <ResourceView<Row>
      title="season"
      rows={rows}
      columns={COLUMNS}
      fields={FIELDS}
      toValues={(row) => ({
        seasonNumber: String(row.seasonNumber),
        startDate: row.startDate,
        endDate: row.endDate ?? "",
        theme: row.theme ?? "",
        image: "",
      })}
      onCreate={(values) =>
        create.mutateAsync({
          seasonNumber: Number.parseInt(pick(values, "seasonNumber"), 10),
          startDate: pick(values, "startDate"),
          endDate: optionalText(pick(values, "endDate")) ?? null,
          theme: optionalText(pick(values, "theme")) ?? null,
          image: optionalText(pick(values, "image")) ?? null,
        })
      }
      onUpdate={(id, values) =>
        update.mutateAsync({
          id: id as number,
          patch: {
            seasonNumber: Number.parseInt(pick(values, "seasonNumber"), 10),
            startDate: pick(values, "startDate"),
            endDate: optionalText(pick(values, "endDate")) ?? null,
            theme: optionalText(pick(values, "theme")) ?? null,
            image: optionalText(pick(values, "image")) ?? null,
          },
        })
      }
      onDelete={(id) => remove.mutateAsync({ id: id as number })}
    />
  );
}
