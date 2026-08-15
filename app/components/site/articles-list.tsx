"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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

  return (
    <>
      <div className="mb-4 flex min-h-12 flex-wrap items-center gap-3">
        <span className="min-w-[120px] font-bold">{visible.length} articles</span>
        <input
          type="text"
          value={search}
          placeholder="Search articles..."
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-[200px] flex-1 rounded border border-[#ccc] p-2"
        />
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          className="min-w-[100px] rounded border border-[#ccc] p-2"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="likes">Most liked</option>
          <option value="title">Title</option>
        </select>
        <span className="rounded-full bg-brand-navy px-3 py-1 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(45,60,80,0.3)]">
          {sort === "likes" ? "By likes" : sort === "title" ? "A → Z" : `By date`}
        </span>
      </div>

      <div className="grid min-h-[600px] grid-cols-1 gap-4 md:grid-cols-2">
        {visible.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            className="min-h-[350px] text-inherit no-underline max-md:min-h-[300px]"
          >
            <article className="flex min-h-[350px] flex-col overflow-hidden rounded-lg border border-[#ddd] bg-white transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] max-md:min-h-[300px]">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="h-[250px] w-full object-cover"
              />
              <h2 className="mx-4 mb-2 mt-3 text-xl">{article.title}</h2>
              <p className="mx-4 mb-4 text-base text-[#555]">{article.summary}</p>
              <div className="mt-auto flex items-center justify-between px-4 pb-4 text-sm text-[#666]">
                <span className="flex items-center gap-1 font-medium hover:text-[#d32f2f]">
                  ♥ {article.likes}
                </span>
                <span className="italic text-[#888]">
                  {new Date(article.createdAt).toLocaleDateString()}
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </>
  );
}
