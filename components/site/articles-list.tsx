"use client";

import Link from "next/link";
import { UrlFilterSelect, UrlPagination, UrlSearchBar } from "./url-controls";

export interface ArticleListRow {
  id: number;
  title: string;
  summary: string;
  imageUrl: string;
  likes: number;
  authorName: string;
  createdAt: string;
}

// Formatted in UTC so the server render and the client hydration agree; a local
// zone would flip the day for anything published near midnight UTC.
function shortDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
}

const LEAD_LABELS: Record<string, string> = {
  likes: "Most liked",
  title: "First A–Z",
  oldest: "Oldest",
};

export function ArticlesList({
  articles,
  total,
  totalPages,
  sort,
}: {
  articles: ArticleListRow[];
  total: number;
  totalPages: number;
  sort: string;
}) {
  const [lead, ...rest] = articles;

  return (
    <>
      <div className="flex flex-wrap items-end gap-5 border-b border-rvl-line px-5 py-7 sm:px-8 xl:px-14">
        <UrlFilterSelect
          id="articles-sort"
          label="Sort"
          paramKey="sort"
          options={[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "likes", label: "Most liked" },
            { value: "title", label: "Title A–Z" },
          ]}
        />

        <UrlSearchBar className="max-w-[380px]" placeholder="Search titles, summaries, authors" />

        <span className="self-end pb-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim">
          {total} articles
        </span>

        <div className="ml-auto self-end">
          <UrlPagination variant="compact" totalPages={totalPages} />
        </div>
      </div>

      {lead ? (
        <div className="border-b border-rvl-line px-5 py-12 sm:px-8 xl:px-14">
          <Link
            href={`/articles/${lead.id}`}
            className="grid grid-cols-1 items-center gap-8 text-inherit no-underline lg:grid-cols-[1.15fr_1fr] lg:gap-12"
          >
            <div>
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rvl-accent">
                {LEAD_LABELS[sort] ?? "Latest"}
              </span>
              <h2 className="mt-5 mb-4 text-balance font-display text-[2rem] font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-[2.5rem]">
                {lead.title}
              </h2>
              <p className="m-0 mb-6 max-w-[46ch] text-[1rem] text-rvl-ink-2">{lead.summary}</p>
              <div className="flex flex-wrap gap-5 font-mono text-[0.68rem] uppercase tracking-[0.13em] text-rvl-dim">
                <span>{lead.authorName}</span>
                <span className="tabular-nums">{shortDate(lead.createdAt)}</span>
                <span className="tabular-nums text-rvl-accent">♥ {lead.likes}</span>
              </div>
            </div>
            <img
              src={lead.imageUrl}
              alt={lead.title}
              className="aspect-4/3 w-full border border-rvl-line object-cover"
            />
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 xl:px-14">
        {rest.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            className="group flex flex-col border border-rvl-line text-inherit no-underline transition-colors hover:border-rvl-accent-soft"
          >
            <img
              src={article.imageUrl}
              alt={article.title}
              className="aspect-16/9 w-full border-b border-rvl-line object-cover"
            />
            <div className="flex flex-1 flex-col p-6">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rvl-accent">
                {article.authorName}
              </span>
              <h3 className="mt-4 mb-3 text-[1.12rem] font-semibold leading-[1.28]">
                {article.title}
              </h3>
              <p className="m-0 mb-5 line-clamp-3 text-[0.88rem] text-rvl-ink-2">
                {article.summary}
              </p>
              <span className="mt-auto font-mono text-[0.64rem] uppercase tracking-[0.12em] text-rvl-dim">
                {shortDate(article.createdAt)} · ♥ {article.likes}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
