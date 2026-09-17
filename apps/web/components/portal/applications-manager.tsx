"use client";

import { pick, ResourceView, optionalText, type ColumnSpec, type FieldSpec } from "./resource-view";
import { Badge } from "@components/ui/badge";
import { APPLICATION_CATEGORY_LABELS } from "@/lib/applications";
import { trpc } from "@/lib/trpc";

type Status = "open" | "closed";
type Category = keyof typeof APPLICATION_CATEGORY_LABELS;

interface Row {
  id: number;
  slug: string;
  name: string;
  type: string;
  description: string;
  url: string | null;
  status: Status;
  category: Category;
}

const COLUMNS: ColumnSpec<Row>[] = [
  { key: "name", label: "Application", render: (row) => row.name },
  {
    key: "category",
    label: "Category",
    render: (row) => APPLICATION_CATEGORY_LABELS[row.category],
  },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <Badge variant={row.status === "open" ? "secondary" : "outline"}>{row.status}</Badge>
    ),
  },
  {
    key: "url",
    label: "Form URL",
    render: (row) => row.url ?? "—",
  },
];

const FIELDS: FieldSpec[] = [
  {
    name: "url",
    label: "Application URL",
    type: "url",
    placeholder: "https://forms.gle/...",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: [
      { value: "open", label: "Open" },
      { value: "closed", label: "Closed" },
    ],
  },
];

export function ApplicationsManager({ rows }: { rows: Row[] }) {
  const update = trpc.applications.update.useMutation();

  return (
    <ResourceView<Row>
      title="application"
      rows={rows}
      columns={COLUMNS}
      fields={FIELDS}
      toValues={(row) => ({
        url: row.url ?? "",
        status: row.status,
      })}
      onUpdate={(id, values) => {
        const row = rows.find((entry) => entry.id === id);
        return update.mutateAsync({
          slug: row?.slug ?? "",
          url: optionalText(pick(values, "url")) ?? null,
          status: pick(values, "status") as Status,
        });
      }}
    />
  );
}
