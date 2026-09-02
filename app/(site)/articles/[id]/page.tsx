import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@server/session";
import { api } from "@server/trpc/server";
import { LikeButton } from "@components/site/like-button";
import { ArticleContent } from "@components/site/article-content";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

// Cached so generateMetadata and the page share one fetch per request.
const load = cache(async (id: string) => {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return (await api()).articles.byId({ id: parsed });
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

  const user = await getSessionUser();
  const status = await (await api()).articles.likeStatus({ id: article.id });

  return (
    <article className="font-display">
      <header className="border-b border-rvl-line px-5 py-12 sm:px-8 sm:py-14 xl:px-14">
        {article.approved !== true ? (
          <div className="mb-8 flex flex-wrap items-center gap-3 border border-rvl-line px-4 py-3 text-[0.85rem] text-rvl-ink-2">
            <span className="border border-rvl-accent-soft px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-rvl-accent">
              {article.approved === null ? "Pending approval" : "Rejected"}
            </span>
            <span>
              {article.approved === null
                ? "This article is awaiting review and is not visible to the public yet."
                : "This article was rejected and is not visible to the public."}
            </span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <div>
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
              {article.authorName}
            </span>
            <h1 className="mt-5 mb-5 text-balance text-[2.2rem] font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-[2.9rem]">
              {article.title}
            </h1>
            <p className="m-0 mb-6 max-w-[52ch] text-[1.05rem] text-rvl-ink-2">
              {article.summary}
            </p>
            <div className="flex flex-wrap gap-5 font-mono text-[0.68rem] uppercase tracking-[0.13em] text-rvl-dim">
              <span className="tabular-nums">
                {new Date(article.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="tabular-nums text-rvl-accent">♥ {article.likes}</span>
            </div>
          </div>

          <img
            src={article.imageUrl}
            alt={article.title}
            className="aspect-4/3 w-full border border-rvl-line object-cover"
          />
        </div>
      </header>

      <div className="border-b border-rvl-line px-5 py-14 sm:px-8 xl:px-14">
        <ArticleContent
          content={article.content}
          className="max-w-[68ch] text-[1.05rem] leading-[1.75] text-rvl-ink-2 [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:text-[1.35rem] [&>h2]:font-bold [&>h2]:uppercase [&>h2]:tracking-[-0.02em] [&>h2]:text-rvl-ink [&>h3]:mt-8 [&>h3]:mb-3 [&>h3]:text-[1.1rem] [&>h3]:font-semibold [&>h3]:text-rvl-ink [&>p]:mb-5 [&_a]:text-rvl-accent [&_img]:my-8 [&_img]:w-full [&_img]:border [&_img]:border-rvl-line"
        />
      </div>

      <div className="px-5 py-10 sm:px-8 xl:px-14">
        <LikeButton
          articleId={article.id}
          initialLiked={status.liked}
          initialLikes={article.likes}
          signedIn={user !== null}
        />
      </div>
    </article>
  );
}
