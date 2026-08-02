import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Local development is the safe default. Deployments must explicitly set
// NODE_ENV=production to enable production-only behavior.
process.env.NODE_ENV ??= "development";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    JWT_SECRET: z.string().trim().optional(),
    DATABASE_URL: z.string().trim().min(1).optional(),
    DB_HOST: z.string().trim().optional(),
    DB_PORT: z.coerce.number().int().positive().optional(),
    DB_USER: z.string().trim().optional(),
    DB_PASS: z.string().optional(),
    DB_NAME: z.string().trim().optional(),
    DB_SSL: z.string().optional(),
    DB_SSL_REJECT_UNAUTHORIZED: z.string().optional(),
    TYPEORM_SYNCHRONIZE: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== "production") {
      return;
    }

    if (!data.JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET is required in production",
      });
    }

    const hasDatabaseUrl = Boolean(data.DATABASE_URL);
    if (hasDatabaseUrl) {
      return;
    }

    const missing: string[] = [];
    if (!data.DB_HOST) missing.push("DB_HOST");
    if (!data.DB_USER) missing.push("DB_USER");
    if (data.DB_PASS === undefined || data.DB_PASS === "") missing.push("DB_PASS");
    if (!data.DB_NAME) missing.push("DB_NAME");

    if (missing.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: `Production requires DATABASE_URL or ${missing.join(", ")}`,
      });
    }
  });

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("FATAL: Invalid environment configuration");
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join(".") : "env";
      console.error(`  - ${path}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;

export type DbSslConfig = false | { rejectUnauthorized: boolean };

export function resolveDbSsl(
  databaseUrl: string | undefined,
  dbSsl: string | undefined,
  dbSslRejectUnauthorized: string | undefined,
): DbSslConfig {
  const url = databaseUrl ?? "";
  const sslEnabled = dbSsl === "true" || /sslmode=require/i.test(url);
  if (!sslEnabled) {
    return false;
  }
  return { rejectUnauthorized: dbSslRejectUnauthorized !== "false" };
}

export function getPostgresConnectionOptions(envConfig: Env = env) {
  const ssl = resolveDbSsl(
    envConfig.DATABASE_URL,
    envConfig.DB_SSL,
    envConfig.DB_SSL_REJECT_UNAUTHORIZED,
  );

  if (envConfig.DATABASE_URL) {
    return { url: envConfig.DATABASE_URL, ssl };
  }

  const isProd = envConfig.NODE_ENV === "production";
  return {
    host: envConfig.DB_HOST ?? (isProd ? undefined : "localhost"),
    port: envConfig.DB_PORT ?? (isProd ? undefined : 5432),
    username: envConfig.DB_USER ?? (isProd ? undefined : "postgres"),
    password: envConfig.DB_PASS ?? (isProd ? undefined : "password"),
    database: envConfig.DB_NAME ?? (isProd ? undefined : "volleyball"),
    ssl,
  };
}
