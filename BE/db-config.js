// Shared Postgres connection helpers for standalone JS scripts.
import dotenv from "dotenv";

dotenv.config();
process.env.NODE_ENV ??= "development";

export function validateDbEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

  if (!isProd || hasDatabaseUrl) {
    return;
  }

  const missing = [];
  if (!process.env.DB_HOST?.trim()) missing.push("DB_HOST");
  if (!process.env.DB_USER?.trim()) missing.push("DB_USER");
  if (process.env.DB_PASS === undefined || process.env.DB_PASS === "") {
    missing.push("DB_PASS");
  }
  if (!process.env.DB_NAME?.trim()) missing.push("DB_NAME");

  if (missing.length > 0) {
    console.error(
      `FATAL: Production requires DATABASE_URL or ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

export function resolveDbSsl(
  databaseUrl,
  dbSsl,
  dbSslRejectUnauthorized,
) {
  const url = databaseUrl ?? "";
  const sslEnabled = dbSsl === "true" || /sslmode=require/i.test(url);
  if (!sslEnabled) {
    return false;
  }
  return { rejectUnauthorized: dbSslRejectUnauthorized !== "false" };
}

export function getPostgresConnectionOptions() {
  validateDbEnv();

  const ssl = resolveDbSsl(
    process.env.DATABASE_URL,
    process.env.DB_SSL,
    process.env.DB_SSL_REJECT_UNAUTHORIZED,
  );

  if (process.env.DATABASE_URL) {
    return { url: process.env.DATABASE_URL, ssl };
  }

  const isProd = process.env.NODE_ENV === "production";
  return {
    host: process.env.DB_HOST || (isProd ? undefined : "localhost"),
    port: Number(process.env.DB_PORT) || (isProd ? undefined : 5432),
    username: process.env.DB_USER || (isProd ? undefined : "postgres"),
    password: process.env.DB_PASS ?? (isProd ? undefined : "password"),
    database: process.env.DB_NAME || (isProd ? undefined : "volleyball"),
    ssl,
  };
}
