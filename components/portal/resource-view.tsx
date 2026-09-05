"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePortalErrorToast } from "./portal-error-detail";
import { cn } from "@/lib/utils";
import { Pagination, SearchBar } from "@components/site/controls";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

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
  "w-full rounded-xs border border-rvl-line bg-transparent px-3.5 py-2.5 text-[0.92rem] text-rvl-ink outline-none transition-colors placeholder:text-rvl-dim focus:border-rvl-accent-soft";

const createButtonClass =
  "inline-flex cursor-pointer items-center gap-1.5 border-none bg-rvl-accent-bg px-4 py-2.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent transition-opacity hover:enabled:opacity-85 disabled:cursor-not-allowed disabled:opacity-50";

const deleteButtonClass =
  "cursor-pointer rounded-xs border border-rvl-line bg-transparent p-1.5 text-rvl-dim transition-colors hover:enabled:border-destructive hover:enabled:text-destructive disabled:cursor-not-allowed disabled:opacity-50";

const editButtonClass =
  "cursor-pointer rounded-xs border border-rvl-line bg-transparent p-1.5 text-rvl-dim transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent";

const PER_PAGE = 25;

const CLEAR_SELECT = "__none";

function emptyValues(fields: FieldSpec[]): Values {
  return Object.fromEntries(fields.map((field) => [field.name, ""]));
}

// Rows carry nested relations (a game's teams, an award's players) that are
// rendered as columns, so the search has to look inside them instead of
// stringifying them to "[object Object]".
function searchableText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(searchableText).join(" ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(searchableText)
      .join(" ");
  }
  return String(value);
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
      <Select
        value={value}
        onValueChange={(next) => onChange(next === CLEAR_SELECT ? "" : next)}
        required={field.required ?? false}
      >
        <SelectTrigger
          id={field.name}
          className="w-full rounded-xs border-rvl-line bg-transparent px-3.5 text-[0.9rem] data-[size=default]:h-10 hover:border-rvl-line-strong focus-visible:border-rvl-accent-soft focus-visible:ring-0"
        >
          <SelectValue placeholder="Choose…" />
        </SelectTrigger>
        <SelectContent className="rounded-xs border-rvl-line">
          {/* Radix forbids an item with an empty value, so an optional field needs a
              sentinel item to get back to "unset" once something has been picked. */}
          {field.required ? null : (
            <SelectItem
              value={CLEAR_SELECT}
              className="rounded-xs text-[0.88rem] text-rvl-dim focus:bg-rvl-panel focus:text-rvl-accent"
            >
              None
            </SelectItem>
          )}
          {field.options?.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="rounded-xs text-[0.88rem] focus:bg-rvl-panel focus:text-rvl-accent"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <input
        id={field.name}
        type="checkbox"
        checked={value === "true"}
        onChange={(event) => onChange(String(event.target.checked))}
        className="size-4 rounded-xs border border-rvl-line accent-rvl-accent-bg"
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
  const showErrorToast = usePortalErrorToast();
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
              showErrorToast("Save failed", error);
            } finally {
              setPending(false);
            }
          }}
        >
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <label
                htmlFor={field.name}
                className="block font-mono text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim"
              >
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
  const showErrorToast = usePortalErrorToast();
  const [deleting, setDeleting] = useState<Row["id"] | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query === "") return rows;
    return rows.filter((row) => searchableText(row).toLowerCase().includes(query));
  }, [rows, search]);

  const totalPages = Math.max(Math.ceil(filtered.length / PER_PAGE), 1);
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <SearchBar
          className="max-w-[320px]"
          value={search}
          placeholder={`Search ${title.toLowerCase()}`}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />

        <p className="m-0 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-rvl-dim">
          {filtered.length} {filtered.length === 1 ? "row" : "rows"}
          {filtered.length !== rows.length ? ` of ${rows.length}` : ""}
        </p>

        {totalPages > 1 ? (
          <Pagination
            variant="compact"
            currentPage={current}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        ) : null}

        <div className="ml-auto flex flex-wrap gap-2">
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

      <div className="w-full overflow-x-auto border border-rvl-line">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "border-b border-rvl-line bg-rvl-panel px-4 py-3 text-left font-mono text-[0.58rem] font-bold uppercase tracking-[0.2em] text-rvl-dim",
                    column.align === "right" && "text-right",
                  )}
                >
                  {column.label}
                </th>
              ))}
              {onUpdate || onDelete ? (
                <th className="border-b border-rvl-line bg-rvl-panel px-4 py-3 text-right font-mono text-[0.58rem] font-bold uppercase tracking-[0.2em] text-rvl-dim">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onUpdate || onDelete ? 1 : 0)}
                  className="px-4 py-16 text-center font-mono text-[0.72rem] uppercase tracking-[0.14em] text-rvl-dim"
                >
                  {rows.length === 0 ? "No rows yet" : "No rows match that search"}
                </td>
              </tr>
            ) : null}
            {visible.map((row) => (
              <tr key={String(row.id)} className="transition-colors hover:bg-rvl-panel">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "border-b border-rvl-line px-4 py-3 text-left text-[0.92rem]",
                      column.align === "right" && "text-right font-mono tabular-nums",
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
                {onUpdate || onDelete ? (
                  <td className="border-b border-rvl-line px-4 py-3 text-right">
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
                              showErrorToast("Delete failed", error);
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

export function pick(values: Values, key: string): string {
  return values[key] ?? "";
}

export function optionalNumber(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
