import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { articles } from "@server/services";
import { getSessionUser } from "@server/session";
import { PageHeader, Section } from "@components/site/page-header";
import { LikeButton } from "@components/site/like-button";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

async function load(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return articles.getById(getDb(), parsed);
}

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

  const user = await getSessionUser();
  const status = await articles.likeStatus(getDb(), article.id, user?.id ?? null);

  return (
    <>
      <PageHeader
        eyebrow={`by ${article.authorName}`}
        title={article.title}
        description={article.summary}
        actions={
          <LikeButton
            articleId={article.id}
            initialLiked={status.liked}
            initialLikes={article.likes}
            signedIn={user !== null}
          />
        }
      />
      <Section>
        <article className="prose-sm mx-auto max-w-3xl space-y-4 text-base leading-relaxed">
          {article.content.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </article>
      </Section>
    </>
  );
}
