"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { pick, ResourceView, type ColumnSpec, type FieldSpec } from "./resource-view";
import { usePortalErrorToast } from "./portal-error-detail";
import { ArticleDisplay } from "@components/site/article-display";
import { cn } from "@/lib/utils";
import { Badge } from "@components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { trpc } from "@/lib/trpc";

export interface ArticleRow {
  id: number;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  approved: boolean | null;
  likes: number;
  authorName: string;
  createdAt: string | Date;
}

const COLUMNS: ColumnSpec<ArticleRow>[] = [
  {
    key: "title",
    label: "Title",
    render: (row) => (
      <span className="underline-offset-4 group-hover/row:underline">{row.title}</span>
    ),
  },
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

type StatusFilter = "pending" | "published" | "rejected" | "all";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

function matchesStatus(row: ArticleRow, status: StatusFilter) {
  if (status === "all") return true;
  if (status === "pending") return row.approved === null;
  if (status === "published") return row.approved === true;
  return row.approved === false;
}

const FIELDS: FieldSpec[] = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "summary", label: "Summary", type: "text", required: true },
  { name: "imageUrl", label: "Image URL", type: "url", required: true },
  { name: "content", label: "Content", type: "richtext", required: true },
];

const approveButtonClass =
  "inline-flex cursor-pointer items-center border-none bg-rvl-accent-bg px-3 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent transition-opacity hover:enabled:opacity-85 disabled:cursor-not-allowed disabled:opacity-50";

const rejectButtonClass =
  "inline-flex cursor-pointer items-center border border-destructive bg-transparent px-3 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-destructive transition-colors hover:enabled:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50";

function ReviewButtons({
  approved,
  pending,
  onApprove,
  onReject,
}: {
  approved: boolean | null;
  pending: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <>
      <button
        type="button"
        disabled={pending || approved === true}
        onClick={onApprove}
        className={approveButtonClass}
      >
        {approved === true ? "Approved" : "Approve"}
      </button>
      <button
        type="button"
        disabled={pending || approved === false}
        onClick={onReject}
        className={rejectButtonClass}
      >
        {approved === false ? "Rejected" : "Reject"}
      </button>
    </>
  );
}

export function ArticlesManager({ rows }: { rows: ArticleRow[] }) {
  const router = useRouter();
  const { showErrorToast } = usePortalErrorToast();
  const update = trpc.articles.update.useMutation();
  const remove = trpc.articles.delete.useMutation();
  const [preview, setPreview] = useState<ArticleRow | null>(null);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [status, setStatus] = useState<StatusFilter>("pending");

  const visible = useMemo(
    () => rows.filter((row) => matchesStatus(row, status)),
    [rows, status],
  );

  const counts = useMemo(
    () => ({
      pending: rows.filter((row) => row.approved === null).length,
      published: rows.filter((row) => row.approved === true).length,
      rejected: rows.filter((row) => row.approved === false).length,
    }),
    [rows],
  );

  async function setApproved(row: ArticleRow, approved: boolean) {
    setReviewing(row.id);
    try {
      await update.mutateAsync({ id: row.id, patch: { approved } });
      toast.success(approved ? "Article approved." : "Article rejected.");
      setPreview((current) => (current?.id === row.id ? { ...current, approved } : current));
      router.refresh();
    } catch (error) {
      showErrorToast(approved ? "Approve failed" : "Reject failed", error);
    } finally {
      setReviewing(null);
    }
  }

  return (
    <>
      <ResourceView<ArticleRow>
        title="article"
        rows={visible}
        columns={COLUMNS}
        fields={FIELDS}
        filters={
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">
              Status
            </span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Status">
              {STATUS_FILTERS.map((option) => {
                const count =
                  option.value === "all"
                    ? rows.length
                    : counts[option.value];
                const active = status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatus(option.value)}
                    className={cn(
                      "cursor-pointer border px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em]",
                      active
                        ? "border-rvl-accent-soft text-rvl-accent"
                        : "border-rvl-line text-rvl-dim hover:border-rvl-line-strong hover:text-rvl-ink",
                    )}
                  >
                    {option.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        }
        toValues={(row) => ({
          title: row.title,
          summary: row.summary,
          imageUrl: row.imageUrl,
          content: row.content,
        })}
        emptyLabel={status === "all" ? "No articles yet" : "No articles with that status"}
        onRowClick={setPreview}
        rowClickLabel={(row) => `Preview ${row.title}`}
        rowActions={(row) => (
          <ReviewButtons
            approved={row.approved}
            pending={reviewing === row.id}
            onApprove={() => void setApproved(row, true)}
            onReject={() => void setApproved(row, false)}
          />
        )}
        onUpdate={(id, values) =>
          update.mutateAsync({
            id: id as number,
            patch: {
              title: pick(values, "title"),
              summary: pick(values, "summary"),
              imageUrl: pick(values, "imageUrl"),
              content: pick(values, "content"),
            },
          })
        }
        onDelete={(id) => remove.mutateAsync({ id: id as number })}
      />

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="flex max-h-[92vh] w-[min(96vw,64rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,64rem)]">
          <DialogHeader className="border-b border-rvl-line px-5 py-4 sm:px-6">
            <DialogTitle>Article preview</DialogTitle>
            <DialogDescription>
              This is how the article looks on the public site. Approve or reject it from here, or
              close the preview and use Edit to change the text.
            </DialogDescription>
          </DialogHeader>

          {preview ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ArticleDisplay article={preview} compact />
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-between">
            <p className="m-0 self-center font-mono text-[0.62rem] uppercase tracking-[0.14em] text-rvl-dim">
              {preview?.approved === null
                ? "Awaiting review"
                : preview?.approved
                  ? "Currently published"
                  : "Currently rejected"}
            </p>
            {preview ? (
              <div className="flex flex-wrap justify-end gap-2">
                <ReviewButtons
                  approved={preview.approved}
                  pending={reviewing === preview.id}
                  onApprove={() => void setApproved(preview, true)}
                  onReject={() => void setApproved(preview, false)}
                />
              </div>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
