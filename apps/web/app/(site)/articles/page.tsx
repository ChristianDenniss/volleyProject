import type { Metadata } from "next";
import { siteApi } from "@server/trpc/server";
import { pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { ArticlesList } from "@components/site/articles-list";
import { ArticlesWriteLink } from "@components/site/articles-write-link";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader } from "@components/site/page-header";

export const revalidate = 60;

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
  const trpc = siteApi();
  const sort = stringParam(params, "sort");

  const page = await trpc.articles.listPage({
    page: pageParam(params),
    search: stringParam(params, "q"),
    sort:
      sort === "oldest" || sort === "likes" || sort === "title" || sort === "newest"
        ? sort
        : undefined,
  });

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="League desk"
        title="Articles"
        description="Match reports, roster news and explainers written by the community."
        actions={<ArticlesWriteLink />}
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
