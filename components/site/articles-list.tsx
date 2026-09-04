"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilterSelect, SearchBar } from "./controls";

export interface ArticleListRow {
  id: number;
  title: string;
  summary: string;
  imageUrl: string;
  likes: number;
  authorName: string;
  createdAt: string;
}

type SortKey = "newest" | "oldest" | "likes" | "title";

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

export function ArticlesList({ articles }: { articles: ArticleListRow[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const visible = useMemo(() => {
    const query = search.toLowerCase();
    const filtered = articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.authorName.toLowerCase().includes(query),
    );

    return [...filtered].sort((a, b) => {
      if (sort === "likes") return b.likes - a.likes;
      if (sort === "title") return a.title.localeCompare(b.title);
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return sort === "oldest" ? left - right : right - left;
    });
  }, [articles, search, sort]);

  const [lead, ...rest] = visible;

  return (
    <>
      <div className="flex flex-wrap items-end gap-5 border-b border-rvl-line px-5 py-7 sm:px-8 xl:px-14">
        <FilterSelect
          id="articles-sort"
          label="Sort"
          value={sort}
          onChange={(value) => setSort(value as SortKey)}
          options={[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "likes", label: "Most liked" },
            { value: "title", label: "Title A–Z" },
          ]}
        />

        <SearchBar
          className="max-w-[380px]"
          value={search}
          placeholder="Search titles, summaries, authors"
          onSearch={setSearch}
        />

        <span className="self-end pb-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim">
          {visible.length} articles
        </span>
      </div>

      {lead ? (
        <div className="border-b border-rvl-line px-5 py-12 sm:px-8 xl:px-14">
          <Link
            href={`/articles/${lead.id}`}
            className="grid grid-cols-1 items-center gap-8 text-inherit no-underline lg:grid-cols-[1.15fr_1fr] lg:gap-12"
          >
            <div>
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rvl-accent">
                {sort === "likes"
                  ? "Most liked"
                  : sort === "title"
                    ? "First A–Z"
                    : sort === "oldest"
                      ? "Oldest"
                      : "Latest"}
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
