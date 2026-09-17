import { asc, eq } from "drizzle-orm";
import type { Db } from "@db";
import {
  applications,
  type ApplicationCategory,
  type ApplicationStatus,
} from "@db/schema";
import { insertManyIgnore } from "@db/insert";
import { found } from "./errors";
import { cachedSiteRead } from "./site-read-cache";

export type ApplicationInput = {
  url?: string | null | undefined;
  status?: ApplicationStatus | undefined;
};

const columns = {
  id: applications.id,
  slug: applications.slug,
  name: applications.name,
  type: applications.type,
  description: applications.description,
  url: applications.url,
  status: applications.status,
  category: applications.category,
  sortOrder: applications.sortOrder,
};

export const DEFAULT_APPLICATIONS: Array<{
  slug: string;
  name: string;
  type: string;
  description: string;
  url: string | null;
  status: ApplicationStatus;
  category: ApplicationCategory;
  sortOrder: number;
}> = [
  {
    slug: "staff",
    name: "Staff application",
    type: "General staff position",
    description:
      "Apply to become a staff member of the Roblox Volleyball League. Help manage the community and keep each season running.",
    url: "https://forms.gle/TgpFMdP8zVmyqKjk6",
    status: "closed",
    category: "staff",
    sortOrder: 1,
  },
  {
    slug: "media",
    name: "Media team application",
    type: "Content creation and streaming",
    description: "Create content, stream RVL matches, manage social media and help promote the league.",
    url: "https://forms.gle/L6QFsuztCaJMRQyp8",
    status: "closed",
    category: "media",
    sortOrder: 2,
  },
  {
    slug: "referee",
    name: "Referee application",
    type: "Game officiating",
    description: "Officiate volleyball matches, keep play fair and hold the game to its rules.",
    url: null,
    status: "closed",
    category: "game-officials",
    sortOrder: 3,
  },
  {
    slug: "moderator",
    name: "Server moderator application",
    type: "Community management",
    description: "Moderate our Discord spaces, enforce the rules and keep the environment positive.",
    url: null,
    status: "closed",
    category: "management",
    sortOrder: 4,
  },
  {
    slug: "game-moderator",
    name: "Game moderator application",
    type: "Game officiating",
    description:
      "Moderate ranked Volleyball 4.2 games, act on rule violations and keep play fair for everyone.",
    url: null,
    status: "closed",
    category: "game-officials",
    sortOrder: 5,
  },
  {
    slug: "stats",
    name: "Stats team application",
    type: "Data management",
    description:
      "Track player statistics and game data, and keep the records accurate through the playoffs.",
    url: null,
    status: "closed",
    category: "management",
    sortOrder: 6,
  },
  {
    slug: "host",
    name: "Host application",
    type: "Event management",
    description:
      "Organise events outside Volleyball 4.2 and keep the community active with casual pickup matches.",
    url: null,
    status: "closed",
    category: "management",
    sortOrder: 7,
  },
];

async function ensureSeeded(db: Db) {
  const existing = await db.$count(applications);
  if (existing > 0) return;
  await insertManyIgnore(db, applications, DEFAULT_APPLICATIONS);
}

export async function list(db: Db) {
  return cachedSiteRead("applications-list", [], async () => {
    await ensureSeeded(db);
    return db
      .select(columns)
      .from(applications)
      .orderBy(asc(applications.sortOrder), asc(applications.id));
  });
}

export async function count(db: Db) {
  await ensureSeeded(db);
  return db.$count(applications);
}

export async function updateBySlug(db: Db, slug: string, input: ApplicationInput) {
  await ensureSeeded(db);
  const patch: { url?: string | null; status?: ApplicationStatus } = {};
  if (input.url !== undefined) patch.url = input.url === "" ? null : input.url;
  if (input.status !== undefined) patch.status = input.status;
  const [row] = await db
    .update(applications)
    .set(patch)
    .where(eq(applications.slug, slug))
    .returning(columns);
  return found(row, `Application ${slug}`);
}
