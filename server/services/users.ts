import { asc, desc, eq } from "drizzle-orm";
import type { Db } from "@db";
import { correlatedCount } from "@db/sqlx";
import { articles, gameStaff, games, USER_ROLES, user } from "@db/schema";
import { found } from "./errors";
import { ensureLinkedToUser, listTeams } from "./players";

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
  const [authored, linked, staffed] = await Promise.all([
    db
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
      .where(eq(articles.authorId, id)),
    ensureLinkedToUser(db, id),
    db
      .select({
        id: gameStaff.id,
        role: gameStaff.role,
        gameId: games.id,
        gameName: games.name,
        date: games.date,
      })
      .from(gameStaff)
      .innerJoin(games, eq(gameStaff.gameId, games.id))
      .where(eq(gameStaff.userId, id))
      .orderBy(desc(games.date)),
  ]);

  const player = linked
    ? {
        id: linked.id,
        name: linked.name,
        position: linked.position,
        teams: await listTeams(db, linked.id),
      }
    : null;

  const articlesApproved = authored.filter((article) => article.approved === true).length;

  return {
    ...row,
    articles: authored,
    player,
    staff: staffed,
    contributions: {
      streamed: staffed.filter((entry) => entry.role === "streamed").length,
      reffed: staffed.filter((entry) => entry.role === "reffed").length,
      commentated: staffed.filter((entry) => entry.role === "commentated").length,
      articlesApproved,
      articlesTotal: authored.length,
    },
  };
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
