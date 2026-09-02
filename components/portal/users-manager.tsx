"use client";

import { ResourceView, type ColumnSpec, type FieldSpec } from "./resource-view";
import { Badge } from "@components/ui/badge";
import { trpc } from "@/lib/trpc";

const ROLES = ["user", "admin", "superadmin"] as const;

type Role = (typeof ROLES)[number];

interface Row {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  articleCount: number;
}

const COLUMNS: ColumnSpec<Row>[] = [
  { key: "name", label: "Account", render: (row) => row.name },
  { key: "email", label: "Roblox username", render: (row) => row.email },
  {
    key: "role",
    label: "Role",
    render: (row) => <Badge variant={row.role === "user" ? "outline" : "secondary"}>{row.role}</Badge>,
  },
  { key: "articleCount", label: "Articles", align: "right", render: (row) => row.articleCount },
];

const FIELDS: FieldSpec[] = [
  {
    name: "role",
    label: "Role",
    type: "select",
    required: true,
    options: ROLES.map((role) => ({ value: role, label: role })),
  },
];

export function UsersManager({ rows }: { rows: Row[] }) {
  const setRole = trpc.users.setRole.useMutation();

  return (
    <ResourceView<Row>
      title="role"
      rows={rows}
      columns={COLUMNS}
      fields={FIELDS}
      toValues={(row) => ({ role: row.role })}
      onUpdate={(id, values) =>
        setRole.mutateAsync({ id: id as string, role: values.role as Role })
      }
    />
  );
}
