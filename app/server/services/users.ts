import { asc, eq } from "drizzle-orm";
import type { Db } from "@db";
import { correlatedCount } from "@db/sqlx";
import { articles, USER_ROLES, user } from "@db/schema";
import { found } from "./errors";

export type UserRole = (typeof USER_ROLES)[number];

const publicColumns = {
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image,
  role: user.role,
  banned: user.banned,
  createdAt: user.createdAt,
  articleCount: correlatedCount("articles", "author_id", "user", "id"),
};

export async function list(db: Db) {
  return db.select(publicColumns).from(user).orderBy(asc(user.name));
}

export async function getById(db: Db, id: string) {
  const row = await db.select(publicColumns).from(user).where(eq(user.id, id)).get();
  return row ?? null;
}

export async function profile(db: Db, id: string) {
  const row = await getById(db, id);
  if (!row) return null;
  const authored = await db
    .select({
      id: articles.id,
      title: articles.title,
      summary: articles.summary,
      imageUrl: articles.imageUrl,
      approved: articles.approved,
      likes: articles.likes,
      createdAt: articles.createdAt,
    })
    .from(articles)
    .where(eq(articles.authorId, id));
  return { ...row, articles: authored };
}

export async function count(db: Db) {
  return db.$count(user);
}

export async function setRole(db: Db, id: string, role: UserRole) {
  const [row] = await db.update(user).set({ role }).where(eq(user.id, id)).returning(publicColumns);
  return found(row, `User ${id}`);
}

export function isAdmin(role: string | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}
