import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteApi } from "@server/trpc/server";
import { LikeButton } from "@components/site/like-button";
import { ArticleDisplay } from "@components/site/article-display";

export const revalidate = 300;

interface Params {
  params: Promise<{ id: string }>;
}

// Cached so generateMetadata and the page share one fetch per request.
const load = cache(async (id: string) => {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return siteApi().articles.byId({ id: parsed });
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const article = await load(id);
  if (!article) return { title: "Article not found" };

  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      images: [article.imageUrl],
      authors: [article.authorName],
    },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { id } = await params;
  const article = await load(id);
  if (!article) notFound();

  return (
    <ArticleDisplay
      article={article}
      footer={<LikeButton articleId={article.id} initialLikes={article.likes} />}
    />
  );
}
