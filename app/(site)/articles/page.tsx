import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@server/session";
import { api } from "@server/trpc/server";
import { ArticlesList } from "@components/site/articles-list";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader } from "@components/site/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Articles",
  description: "League news, match reports and highlights written by the community.",
};

export default async function ArticlesPage() {
  const trpc = await api();
  const [rows, user] = await Promise.all([trpc.articles.list(), getSessionUser()]);

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

      {rows.length === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>Nothing has been published yet.</EmptyState>
        </div>
      ) : (
        <ArticlesList
          articles={rows.map((article) => ({
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
