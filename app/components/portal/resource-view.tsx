"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";

export type FieldType = "text" | "number" | "date" | "url" | "textarea" | "select" | "checkbox";

export interface FieldSpec {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface ColumnSpec<Row> {
  key: string;
  label: string;
  align?: "left" | "right";
  render: (row: Row) => ReactNode;
}

export type Values = Record<string, string>;

export interface ResourceViewProps<Row extends { id: number | string }> {
  title: string;
  rows: Row[];
  columns: ColumnSpec<Row>[];
  fields: FieldSpec[];
  toValues?: (row: Row) => Values;
  onCreate?: (values: Values) => Promise<unknown>;
  onUpdate?: (id: Row["id"], values: Values) => Promise<unknown>;
  onDelete?: (id: Row["id"]) => Promise<unknown>;
  extra?: ReactNode;
}

function emptyValues(fields: FieldSpec[]): Values {
  return Object.fromEntries(fields.map((field) => [field.name, ""]));
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: string;
  onChange: (next: string) => void;
}) {
  if (field.type === "textarea") {
    return (
      <Textarea
        id={field.name}
        rows={8}
        required={field.required}
        value={value}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        id={field.name}
        required={field.required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <option value="">Choose…</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <input
        id={field.name}
        type="checkbox"
        checked={value === "true"}
        onChange={(event) => onChange(String(event.target.checked))}
        className="size-4 rounded border-input"
      />
    );
  }

  return (
    <Input
      id={field.name}
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
      required={field.required}
      value={value}
      placeholder={field.placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function EntityDialog({
  title,
  description,
  fields,
  initial,
  trigger,
  submitLabel,
  onSubmit,
}: {
  title: string;
  description: string;
  fields: FieldSpec[];
  initial: Values;
  trigger: ReactNode;
  submitLabel: string;
  onSubmit: (values: Values) => Promise<unknown>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(initial);
  const [pending, setPending] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValues(initial);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            try {
              await onSubmit(values);
              toast.success("Saved.");
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "That did not save.");
            } finally {
              setPending(false);
            }
          }}
        >
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <FieldInput
                field={field}
                value={values[field.name] ?? ""}
                onChange={(next) => setValues((current) => ({ ...current, [field.name]: next }))}
              />
            </div>
          ))}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ResourceView<Row extends { id: number | string }>({
  title,
  rows,
  columns,
  fields,
  toValues,
  onCreate,
  onUpdate,
  onDelete,
  extra,
}: ResourceViewProps<Row>) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<Row["id"] | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "row" : "rows"}
        </p>
        <div className="flex gap-2">
          {extra}
          {onCreate ? (
            <EntityDialog
              title={`New ${title}`}
              description="Fields marked required must be filled in."
              fields={fields}
              initial={emptyValues(fields)}
              submitLabel="Create"
              onSubmit={onCreate}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  New
                </Button>
              }
            />
          ) : null}
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.align === "right" ? "text-right" : undefined}
                >
                  {column.label}
                </TableHead>
              ))}
              {onUpdate || onDelete ? <TableHead className="w-24 text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={String(row.id)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={column.align === "right" ? "text-right tabular-nums" : undefined}
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
                {onUpdate || onDelete ? (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {onUpdate && toValues ? (
                        <EntityDialog
                          title={`Edit ${title}`}
                          description="Leave a field untouched to keep its current value."
                          fields={fields}
                          initial={toValues(row)}
                          submitLabel="Save"
                          onSubmit={(values) => onUpdate(row.id, values)}
                          trigger={
                            <Button size="icon" variant="ghost" aria-label="Edit">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                      ) : null}
                      {onDelete ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete"
                          disabled={deleting === row.id}
                          onClick={async () => {
                            setDeleting(row.id);
                            try {
                              await onDelete(row.id);
                              toast.success("Deleted.");
                              router.refresh();
                            } catch (error) {
                              toast.error(
                                error instanceof Error ? error.message : "That did not delete.",
                              );
                            } finally {
                              setDeleting(null);
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function optionalNumber(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
