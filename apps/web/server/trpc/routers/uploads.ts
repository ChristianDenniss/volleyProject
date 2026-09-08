import { uploads } from "@server/services";
import { adminProcedure, protectedProcedure, router } from "../init";
import { imageUpload } from "../schemas";

export const uploadsRouter = router({
  createArticleImage: protectedProcedure.input(imageUpload).mutation(({ ctx, input }) =>
    uploads.store(ctx.db, {
      data: input.data,
      filename: input.filename,
      uploaderId: ctx.user.id,
    }, ctx.uploads),
  ),

  createAsset: adminProcedure.input(imageUpload).mutation(({ ctx, input }) =>
    uploads.store(ctx.db, {
      data: input.data,
      filename: input.filename,
      uploaderId: ctx.user.id,
    }, ctx.uploads),
  ),
});
