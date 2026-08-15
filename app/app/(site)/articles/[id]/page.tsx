import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { articles } from "@server/services";
import { getSessionUser } from "@server/session";
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
    <div className="box-border min-h-screen">
      <article className="mx-auto my-4 grid max-w-[90%] grid-cols-1 overflow-hidden rounded bg-[#fdfdf9] px-8 pb-8 font-serif text-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.05)] max-md:max-w-full max-md:px-4">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="mb-2 block max-h-[90vh] w-full rounded object-cover"
        />

        <h1 className="mb-4 border-b-2 border-[#1a1a1a] pb-2 text-[clamp(2rem,5vw,3rem)] uppercase tracking-[2px]">
          {article.title}
        </h1>

        <div className="mb-8 flex flex-wrap gap-4 font-sans text-[0.9rem] text-[#555]">
          <span>By {article.authorName}</span>
          <span className="before:mr-2 before:content-['•']">
            {new Date(article.createdAt).toLocaleDateString()}
          </span>
          <span className="before:mr-2 before:content-['•']">{article.likes} likes</span>
        </div>

        <p className="mx-8 mb-8 block w-full border-y border-[#1a1a1a] px-8 py-2 text-center font-sans text-[1.2rem] [font-variant:small-caps] max-md:mx-0 max-md:px-2">
          {article.summary}
        </p>

        <div className="mb-8 columns-2 gap-12 text-justify text-[1.1rem] leading-[1.7] max-md:columns-1 [&>p:first-of-type::first-letter]:float-left [&>p:first-of-type::first-letter]:mr-2 [&>p:first-of-type::first-letter]:mt-1 [&>p:first-of-type::first-letter]:text-[4rem] [&>p:first-of-type::first-letter]:font-bold [&>p:first-of-type::first-letter]:leading-none [&>p:first-of-type::first-letter]:text-[#800000]">
          {article.content.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className="mb-6">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-8">
          <LikeButton
            articleId={article.id}
            initialLiked={status.liked}
            initialLikes={article.likes}
            signedIn={user !== null}
          />
        </div>
      </article>
    </div>
  );
}
