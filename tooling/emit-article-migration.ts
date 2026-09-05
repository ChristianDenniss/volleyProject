import fs from "node:fs";
import path from "node:path";

const AUTHOR_ID = "seed-the-entity";
const AUTHOR_NAME = "The Entity";
const AUTHOR_EMAIL = "theentity";
const CREATED_AT = 1735689600000;

interface ArticleSeed {
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  approved: boolean | null;
  likes: number;
  createdAt: number;
  updatedAt: number;
}

function sql(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function articleInsert(article: ArticleSeed): string {
  return [
    `INSERT INTO "articles" ("title", "summary", "content", "image_url", "approved", "likes", "author_id", "created_at", "updated_at")`,
    `SELECT ${sql(article.title)}, ${sql(article.summary)}, ${sql(article.content)}, ${sql(article.imageUrl)}, ${sql(article.approved)}, ${article.likes}, ${sql(AUTHOR_ID)}, ${article.createdAt}, ${article.updatedAt}`,
    `WHERE NOT EXISTS (SELECT 1 FROM "articles" WHERE "title" = ${sql(article.title)});`,
  ].join(" ");
}

const seedPath = path.join(import.meta.dirname, "articles-seed.json");
const outPath = path.join(import.meta.dirname, "..", "drizzle", "0005_seed_articles.sql");
const articles = JSON.parse(fs.readFileSync(seedPath, "utf8")) as ArticleSeed[];

const lines = [
  "-- Seed desk articles for production. Idempotent: skips rows whose title already exists.",
  `INSERT OR IGNORE INTO "user" ("id", "name", "email", "email_verified", "image", "role", "banned", "ban_reason", "ban_expires", "created_at", "updated_at") VALUES (${sql(AUTHOR_ID)}, ${sql(AUTHOR_NAME)}, ${sql(AUTHOR_EMAIL)}, 1, null, 'admin', 0, null, null, ${CREATED_AT}, ${CREATED_AT});`,
  ...articles.map(articleInsert),
  "",
];

fs.writeFileSync(outPath, lines.join("\n"));
process.stdout.write(`wrote ${path.relative(process.cwd(), outPath)} (${articles.length} articles)\n`);
