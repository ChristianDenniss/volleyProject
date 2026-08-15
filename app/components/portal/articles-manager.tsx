"use client";

import { ResourceView, type ColumnSpec, type FieldSpec } from "./resource-view";
import { Badge } from "@components/ui/badge";
import { trpc } from "@/lib/trpc";

interface Row {
  id: number;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  approved: boolean | null;
  likes: number;
  authorName: string;
}

const COLUMNS: ColumnSpec<Row>[] = [
  { key: "title", label: "Title", render: (row) => row.title },
  { key: "author", label: "Author", render: (row) => row.authorName },
  {
    key: "approved",
    label: "Status",
    render: (row) => (
      <Badge variant={row.approved ? "secondary" : "outline"}>
        {row.approved === null ? "awaiting review" : row.approved ? "published" : "rejected"}
      </Badge>
    ),
  },
  { key: "likes", label: "Likes", align: "right", render: (row) => row.likes },
];

const FIELDS: FieldSpec[] = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "summary", label: "Summary", type: "text", required: true },
  { name: "imageUrl", label: "Image URL", type: "url", required: true },
  { name: "content", label: "Content", type: "textarea", required: true },
  { name: "approved", label: "Published", type: "checkbox" },
];

export function ArticlesManager({ rows }: { rows: Row[] }) {
  const update = trpc.articles.update.useMutation();
  const remove = trpc.articles.delete.useMutation();

  return (
    <ResourceView<Row>
      title="article"
      rows={rows}
      columns={COLUMNS}
      fields={FIELDS}
      toValues={(row) => ({
        title: row.title,
        summary: row.summary,
        imageUrl: row.imageUrl,
        content: row.content,
        approved: String(row.approved === true),
      })}
      onUpdate={(id, values) =>
        update.mutateAsync({
          id: id as number,
          patch: {
            title: values.title,
            summary: values.summary,
            imageUrl: values.imageUrl,
            content: values.content,
            approved: values.approved === "true",
          },
        })
      }
      onDelete={(id) => remove.mutateAsync({ id: id as number })}
    />
  );
}
