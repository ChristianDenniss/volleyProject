import { env } from "cloudflare:workers";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { and, eq } from "drizzle-orm";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";
import { makeDb, type Db } from "@db";
import * as schema from "@db/schema";

const accessControl = createAccessControl(defaultStatements);

const roles = {
  user: accessControl.newRole(userAc.statements),
  admin: accessControl.newRole(adminAc.statements),
  superadmin: accessControl.newRole(adminAc.statements),
};

export interface AuthEnvironment {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  ROBLOX_CLIENT_ID: string;
  ROBLOX_CLIENT_SECRET: string;
  ROOT_ROBLOX_IDS?: string | undefined;
}

export function parseRootRobloxIds(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

async function promoteRootUser(db: Db, userId: string, rootIds: string[]): Promise<void> {
  if (rootIds.length === 0) return;

  const [row] = await db
    .select({ role: schema.user.role, accountId: schema.account.accountId })
    .from(schema.account)
    .innerJoin(schema.user, eq(schema.user.id, schema.account.userId))
    .where(and(eq(schema.account.userId, userId), eq(schema.account.providerId, "roblox")))
    .limit(1);

  if (!row || row.role === "superadmin" || !rootIds.includes(row.accountId)) return;

  await db.update(schema.user).set({ role: "superadmin" }).where(eq(schema.user.id, userId));
}

export function buildAuthOptions(db: Db, environment: AuthEnvironment): BetterAuthOptions {
  const rootIds = parseRootRobloxIds(environment.ROOT_ROBLOX_IDS);

  return {
    appName: "volley-project",
    baseURL: environment.BETTER_AUTH_URL,
    secret: environment.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      usePlural: false,
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: { enabled: false },
    socialProviders: {
      roblox: {
        clientId: environment.ROBLOX_CLIENT_ID,
        clientSecret: environment.ROBLOX_CLIENT_SECRET,
      },
    },
    account: {
      accountLinking: { enabled: false },
    },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "user", input: false },
      },
    },
    databaseHooks: {
      session: {
        create: {
          after: async (createdSession) => {
            await promoteRootUser(db, createdSession.userId, rootIds);
          },
        },
      },
    },
    plugins: [
      admin({
        ac: accessControl,
        roles,
        adminRoles: ["admin", "superadmin"],
        defaultRole: "user",
      }),
    ],
  };
}

export type Auth = ReturnType<typeof betterAuth<BetterAuthOptions>>;

export function makeAuth(db: Db, environment: AuthEnvironment): Auth {
  return betterAuth(buildAuthOptions(db, environment));
}

let cached: Auth | undefined;

export function getAuth(): Auth {
  if (!cached) {
    cached = makeAuth(makeDb(env.DB), {
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: env.BETTER_AUTH_URL,
      ROBLOX_CLIENT_ID: env.ROBLOX_CLIENT_ID,
      ROBLOX_CLIENT_SECRET: env.ROBLOX_CLIENT_SECRET,
      ROOT_ROBLOX_IDS: env.ROOT_ROBLOX_IDS,
    });
  }
  return cached;
}
