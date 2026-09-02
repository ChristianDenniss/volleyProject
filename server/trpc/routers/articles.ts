import { TRPCError } from "@trpc/server";
import { articles } from "@server/services";
import { isAdmin } from "@server/services/users";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import { articleCreate, articleUpdate, byId } from "../schemas";

async function assertMayEdit(ctx: { db: Parameters<typeof articles.getById>[0]; user: { id: string; role: string } }, id: number) {
  const article = await articles.getById(ctx.db, id);
  if (!article) throw new TRPCError({ code: "NOT_FOUND", message: `Article ${id} not found` });
  if (article.authorId !== ctx.user.id && !isAdmin(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return article;
}

export const articlesRouter = router({
  list: publicProcedure.query(({ ctx }) => articles.list(ctx.db, { approvedOnly: true })),

  listAll: adminProcedure.query(({ ctx }) => articles.list(ctx.db)),

  byId: publicProcedure.input(byId).query(async ({ ctx, input }) => {
    const article = await articles.getById(ctx.db, input.id);
    if (!article) return null;
    if (article.approved === true) return article;
    if (!ctx.user) return null;
    return article.authorId === ctx.user.id || isAdmin(ctx.user.role) ? article : null;
  }),

  likeStatus: publicProcedure
    .input(byId)
    .query(({ ctx, input }) => articles.likeStatus(ctx.db, input.id, ctx.user?.id ?? null)),

  count: adminProcedure.query(({ ctx }) => articles.count(ctx.db)),

  create: protectedProcedure.input(articleCreate).mutation(async ({ ctx, input }) => {
    const row = await articles.create(ctx.db, ctx.user.id, input);
    revalidate("/", "/articles", "/portal/articles");
    return row;
  }),

  update: protectedProcedure.input(articleUpdate).mutation(async ({ ctx, input }) => {
    const existing = await assertMayEdit(ctx, input.id);
    const patch =
      input.patch.approved !== undefined && !isAdmin(ctx.user.role)
        ? { ...input.patch, approved: existing.approved }
        : input.patch;

    const row = await articles.update(ctx.db, input.id, patch);
    revalidate("/", "/articles", `/articles/${input.id}`, "/portal/articles");
    return row;
  }),

  delete: protectedProcedure.input(byId).mutation(async ({ ctx, input }) => {
    await assertMayEdit(ctx, input.id);
    const row = await articles.remove(ctx.db, input.id);
    revalidate("/", "/articles", "/portal/articles");
    return row;
  }),

  like: protectedProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const result = await articles.like(ctx.db, input.id, ctx.user.id);
    revalidate(`/articles/${input.id}`);
    return result;
  }),

  unlike: protectedProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const result = await articles.unlike(ctx.db, input.id, ctx.user.id);
    revalidate(`/articles/${input.id}`);
    return result;
  }),
});
