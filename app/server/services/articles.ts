import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@db";
import { articleLikes, articles, user } from "@db/schema";
import { found, NotFoundError } from "./errors";

export interface ArticleInput {
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  approved?: boolean | null;
}

const columns = {
  id: articles.id,
  title: articles.title,
  summary: articles.summary,
  content: articles.content,
  imageUrl: articles.imageUrl,
  approved: articles.approved,
  likes: articles.likes,
  createdAt: articles.createdAt,
  updatedAt: articles.updatedAt,
  authorId: articles.authorId,
  authorName: user.name,
};

export async function list(db: Db, options: { approvedOnly?: boolean } = {}) {
  const query = db
    .select(columns)
    .from(articles)
    .innerJoin(user, eq(articles.authorId, user.id))
    .orderBy(desc(articles.createdAt));

  return options.approvedOnly ? query.where(eq(articles.approved, true)) : query;
}

export async function listByAuthor(db: Db, authorId: string) {
  return db
    .select(columns)
    .from(articles)
    .innerJoin(user, eq(articles.authorId, user.id))
    .where(eq(articles.authorId, authorId))
    .orderBy(desc(articles.createdAt));
}

export async function getById(db: Db, id: number) {
  const row = await db
    .select(columns)
    .from(articles)
    .innerJoin(user, eq(articles.authorId, user.id))
    .where(eq(articles.id, id))
    .get();
  return row ?? null;
}

export async function likeStatus(db: Db, articleId: number, userId: string | null) {
  if (!userId) return { liked: false };
  const row = await db.query.articleLikes.findFirst({
    where: and(eq(articleLikes.articleId, articleId), eq(articleLikes.userId, userId)),
  });
  return { liked: row !== undefined };
}

export async function count(db: Db) {
  return db.$count(articles);
}

export async function create(db: Db, authorId: string, input: ArticleInput) {
  const author = await db.query.user.findFirst({ where: eq(user.id, authorId) });
  if (!author) throw new NotFoundError(`User ${authorId}`);

  const [row] = await db
    .insert(articles)
    .values({ ...input, authorId, approved: input.approved ?? null })
    .returning();
  return row;
}

export async function update(db: Db, id: number, input: Partial<ArticleInput>) {
  const [row] = await db.update(articles).set(input).where(eq(articles.id, id)).returning();
  return found(row, `Article ${id}`);
}

export async function remove(db: Db, id: number) {
  const [row] = await db.delete(articles).where(eq(articles.id, id)).returning({ id: articles.id });
  found(row, `Article ${id}`);
  return { id };
}

export async function like(db: Db, articleId: number, userId: string) {
  const article = await db.query.articles.findFirst({ where: eq(articles.id, articleId) });
  if (!article) throw new NotFoundError(`Article ${articleId}`);

  const inserted = await db
    .insert(articleLikes)
    .values({ articleId, userId })
    .onConflictDoNothing()
    .returning({ articleId: articleLikes.articleId });

  if (inserted.length > 0) {
    await db
      .update(articles)
      .set({ likes: sql`${articles.likes} + 1` })
      .where(eq(articles.id, articleId));
  }

  return { liked: true, likes: article.likes + (inserted.length > 0 ? 1 : 0) };
}

export async function unlike(db: Db, articleId: number, userId: string) {
  const article = await db.query.articles.findFirst({ where: eq(articles.id, articleId) });
  if (!article) throw new NotFoundError(`Article ${articleId}`);

  const deleted = await db
    .delete(articleLikes)
    .where(and(eq(articleLikes.articleId, articleId), eq(articleLikes.userId, userId)))
    .returning({ articleId: articleLikes.articleId });

  if (deleted.length > 0) {
    await db
      .update(articles)
      .set({ likes: sql`max(${articles.likes} - 1, 0)` })
      .where(eq(articles.id, articleId));
  }

  return { liked: false, likes: Math.max(article.likes - (deleted.length > 0 ? 1 : 0), 0) };
}
