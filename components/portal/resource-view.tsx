"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@components/site/rich-text-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "url"
  | "textarea"
  | "richtext"
  | "select"
  | "checkbox";

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

const inputClass =
  "w-full rounded border border-[#ccc] bg-white px-3 py-2 text-base text-[#374151] outline-none transition-colors duration-200 focus:border-[#38bdf8] focus:bg-[#f8fafc]";

const createButtonClass =
  "cursor-pointer rounded border-none bg-[#007bff] px-4 py-2 text-base text-white transition-colors duration-200 hover:enabled:bg-[#0056b3] disabled:cursor-not-allowed disabled:bg-[#ccc]";

const deleteButtonClass =
  "cursor-pointer rounded border-none bg-[#dc3545] px-2 py-1 text-white transition-colors duration-200 hover:enabled:bg-[#c82333] disabled:cursor-not-allowed disabled:bg-[#ccc]";

const editButtonClass =
  "cursor-pointer rounded border border-[#2d3c50] bg-white px-2 py-1 text-[#2d3c50] transition-colors duration-200 hover:bg-[#2d3c50] hover:text-white";

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
  if (field.type === "richtext") {
    return <RichTextEditor value={value} onChange={onChange} />;
  }

  if (field.type === "textarea") {
    return (
      <textarea
        id={field.name}
        rows={8}
        required={field.required}
        value={value}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} min-h-[160px] resize-y`}
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
        className={inputClass}
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
        className="size-4 rounded border border-[#ccc]"
      />
    );
  }

  return (
    <input
      id={field.name}
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
      required={field.required}
      value={value}
      placeholder={field.placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
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
      <DialogContent
        className={cn(
          "max-h-[85vh] overflow-y-auto",
          fields.some((field) => field.type === "richtext") ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
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
              <label htmlFor={field.name} className="block font-medium text-[#333]">
                {field.label}
              </label>
              <FieldInput
                field={field}
                value={values[field.name] ?? ""}
                onChange={(next) => setValues((current) => ({ ...current, [field.name]: next }))}
              />
            </div>
          ))}

          <DialogFooter>
            <button type="submit" disabled={pending} className={createButtonClass}>
              {pending ? "Saving…" : submitLabel}
            </button>
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
        <p className="text-sm italic text-[#6b7280]">
          {rows.length} {rows.length === 1 ? "row" : "rows"}
        </p>
        <div className="flex flex-wrap gap-2">
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
                <button type="button" className={createButtonClass}>
                  <Plus className="mr-1 inline size-4" />
                  New
                </button>
              }
            />
          ) : null}
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <table className="w-full min-w-[800px] border-collapse bg-white">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "border-b border-[#e2e8f0] bg-brand-navy px-4 py-3 text-left font-semibold text-white",
                    column.align === "right" && "text-right",
                  )}
                >
                  {column.label}
                </th>
              ))}
              {onUpdate || onDelete ? (
                <th className="border-b border-[#e2e8f0] bg-brand-navy px-4 py-3 text-right font-semibold text-white">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)} className="hover:bg-[#f8fafc]">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "border-b border-[#e2e8f0] px-4 py-3 text-left",
                      column.align === "right" && "text-right tabular-nums",
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
                {onUpdate || onDelete ? (
                  <td className="border-b border-[#e2e8f0] px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {onUpdate && toValues ? (
                        <EntityDialog
                          title={`Edit ${title}`}
                          description="Leave a field untouched to keep its current value."
                          fields={fields}
                          initial={toValues(row)}
                          submitLabel="Save"
                          onSubmit={(values) => onUpdate(row.id, values)}
                          trigger={
                            <button type="button" aria-label="Edit" className={editButtonClass}>
                              <Pencil className="size-4" />
                            </button>
                          }
                        />
                      ) : null}
                      {onDelete ? (
                        <button
                          type="button"
                          aria-label="Delete"
                          className={deleteButtonClass}
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
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
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
