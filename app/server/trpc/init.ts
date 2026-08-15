import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Db } from "@db";
import { ServiceError } from "../services/errors";
import { isAdmin } from "../services/users";

export interface TrpcUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Context {
  db: Db;
  user: TrpcUser | null;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

const translateServiceErrors = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof ServiceError) {
      const code =
        error.code === "NOT_FOUND"
          ? "NOT_FOUND"
          : error.code === "CONFLICT"
            ? "CONFLICT"
            : "BAD_REQUEST";
      throw new TRPCError({ code, message: error.message, cause: error });
    }
    throw error;
  }
});

const requireUser = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const requireAdminRole = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure.use(translateServiceErrors);
export const protectedProcedure = publicProcedure.use(requireUser);
export const adminProcedure = publicProcedure.use(requireAdminRole);
