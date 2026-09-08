import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Db } from "@db";
import type { MatchRegion } from "@/lib/region";
import { errorDetail, explainError, logError } from "../report";
import { isProductionDeployment } from "../environment";
import { ServiceError } from "../services/errors";
import type { UploadBindings } from "../services/uploads";
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
  /** Set on public site requests. Undefined means ALL, or a portal/admin caller. */
  region?: MatchRegion | undefined;
  /** Injected by tests. Undefined resolves the real R2 and images bindings. */
  uploads?: UploadBindings | undefined;
}

export function scopedRegion(ctx: Context, explicit?: MatchRegion | undefined): MatchRegion | undefined {
  return explicit ?? ctx.region;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const exposeInternals = !isProductionDeployment();
    return {
      ...shape,
      message: explainError(error).message,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
        cause: exposeInternals ? errorDetail(error.cause ?? error) || null : null,
      },
    };
  },
});

const translateServiceErrors = t.middleware(async ({ path, type, next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof TRPCError) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        logError("trpc", error, { path, type });
      }
      throw error;
    }
    if (error instanceof ServiceError) {
      const code =
        error.code === "NOT_FOUND"
          ? "NOT_FOUND"
          : error.code === "CONFLICT"
            ? "CONFLICT"
            : "BAD_REQUEST";
      throw new TRPCError({ code, message: error.message, cause: error });
    }
    logError("trpc", error, { path, type });
    const explained = explainError(error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: explained.message,
      cause: error,
    });
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
