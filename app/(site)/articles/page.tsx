import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@server/session";
import { api } from "@server/trpc/server";
import { pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { ArticlesList } from "@components/site/articles-list";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader } from "@components/site/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Articles",
  description: "League news, match reports and highlights written by the community.",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const trpc = await api();
  const sort = stringParam(params, "sort");

  const [page, user] = await Promise.all([
    trpc.articles.listPage({
      page: pageParam(params),
      search: stringParam(params, "q"),
      sort:
        sort === "oldest" || sort === "likes" || sort === "title" || sort === "newest"
          ? sort
          : undefined,
    }),
    getSessionUser(),
  ]);

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="League desk"
        title="Articles"
        description="Match reports, roster news and explainers written by the community."
        actions={
          user ? (
            <Link
              href="/articles/create"
              className="bg-rvl-accent-bg px-5 py-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent no-underline transition-opacity hover:opacity-85"
            >
              Write an article
            </Link>
          ) : (
            <Link
              href="/login"
              className="border border-rvl-line px-5 py-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
            >
              Sign in to write
            </Link>
          )
        }
      />

      {page.total === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>Nothing matches that search.</EmptyState>
        </div>
      ) : (
        <ArticlesList
          total={page.total}
          totalPages={page.totalPages}
          sort={sort ?? "newest"}
          articles={page.rows.map((article) => ({
            id: article.id,
            title: article.title,
            summary: article.summary,
            imageUrl: article.imageUrl,
            likes: article.likes,
            authorName: article.authorName,
            createdAt: String(article.createdAt),
          }))}
        />
      )}
    </div>
  );
}
