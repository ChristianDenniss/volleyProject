import { env } from "cloudflare:workers";
import { betterAuth, type BetterAuthOptions } from "better-auth";
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
}

export function buildAuthOptions(db: Db, environment: AuthEnvironment): BetterAuthOptions {
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
    });
  }
  return cached;
}
