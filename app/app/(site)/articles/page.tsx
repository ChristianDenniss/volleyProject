import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@db";
import { articles } from "@server/services";
import { getSessionUser } from "@server/session";
import { EmptyState } from "@components/site/empty-state";
import { ArticlesList } from "@components/site/articles-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Articles",
  description: "League news, match reports and highlights written by the community.",
};

export default async function ArticlesPage() {
  const [rows, user] = await Promise.all([
    articles.list(getDb(), { approvedOnly: true }),
    getSessionUser(),
  ]);

  return (
    <div className="min-h-screen p-4">
      <h1 className="mb-5 text-[2rem] font-bold text-[#222]">Articles</h1>

      <div className="mb-5 flex justify-end">
        {user ? (
          <Link
            href="/articles/create"
            className="inline-flex h-10 w-[140px] items-center justify-center rounded bg-brand-navy font-medium text-white no-underline transition-colors duration-200 hover:bg-brand-steel"
          >
            Create Article
          </Link>
        ) : (
          <div className="w-full rounded border border-[#ffeeba] bg-[#fff3cd] p-3 text-[#856404]">
            Sign in to write an article.
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState>Nothing has been published yet.</EmptyState>
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
