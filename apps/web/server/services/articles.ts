import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "@db";
import { articleLikes, articles, user } from "@db/schema";
import { found, NotFoundError } from "./errors";
import type { PartialInput } from "./input";
import {
  emptyPage,
  likePattern,
  makePage,
  pageBounds,
  searchTerm,
  type PageQuery,
} from "./paging";

export interface ArticleInput {
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  approved?: boolean | null | undefined;
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

export type ArticleSort = "newest" | "oldest" | "likes" | "title";

export type ArticleStatus = "pending" | "published" | "rejected";

export interface ArticleListFilters extends PageQuery {
  approvedOnly?: boolean | undefined;
  status?: ArticleStatus | undefined;
  sort?: ArticleSort | undefined;
}

function statusFilter(status: ArticleStatus | undefined) {
  if (status === "pending") return isNull(articles.approved);
  if (status === "published") return eq(articles.approved, true);
  if (status === "rejected") return eq(articles.approved, false);
  return undefined;
}

export async function statusCounts(db: Db) {
  const rows = await db
    .select({
      approved: articles.approved,
      total: sql<number>`count(*)`,
    })
    .from(articles)
    .groupBy(articles.approved);

  const counts = { pending: 0, published: 0, rejected: 0, all: 0 };
  for (const row of rows) {
    const total = Number(row.total);
    counts.all += total;
    if (row.approved === null) counts.pending += total;
    else if (row.approved) counts.published += total;
    else counts.rejected += total;
  }
  return counts;
}

function articleFilters(filters: ArticleListFilters) {
  const term = searchTerm(filters);
  return and(
    filters.approvedOnly ? eq(articles.approved, true) : undefined,
    statusFilter(filters.status),
    term
      ? sql`(
          lower(${articles.title}) like ${likePattern(term)} escape '\\'
          or lower(${articles.summary}) like ${likePattern(term)} escape '\\'
          or lower(${user.name}) like ${likePattern(term)} escape '\\'
        )`
      : undefined,
  );
}

function articleOrder(sort: ArticleSort | undefined) {
  if (sort === "oldest") return asc(articles.createdAt);
  if (sort === "likes") return desc(articles.likes);
  if (sort === "title") return asc(articles.title);
  return desc(articles.createdAt);
}

export async function listPage(db: Db, filters: ArticleListFilters = {}) {
  const bounds = pageBounds(filters);
  const where = articleFilters(filters);

  const [counted] = await db
    .select({ total: sql<number>`count(*)` })
    .from(articles)
    .innerJoin(user, eq(articles.authorId, user.id))
    .where(where);

  const total = Number(counted?.total ?? 0);
  if (total === 0) return emptyPage<Awaited<ReturnType<typeof list>>[number]>(bounds);

  const rows = await db
    .select(columns)
    .from(articles)
    .innerJoin(user, eq(articles.authorId, user.id))
    .where(where)
    .orderBy(articleOrder(filters.sort))
    .limit(bounds.perPage)
    .offset(bounds.offset);

  return makePage(rows, total, bounds);
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

export async function update(db: Db, id: number, input: PartialInput<ArticleInput>) {
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
