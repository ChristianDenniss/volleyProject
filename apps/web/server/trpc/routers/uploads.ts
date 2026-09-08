import { uploads } from "@server/services";
import { adminProcedure, protectedProcedure, router } from "../init";
import { byUploadId, uploadRequest } from "../schemas";

export const uploadsRouter = router({
  createArticleImageUrl: protectedProcedure.input(uploadRequest).mutation(({ ctx, input }) =>
    uploads.createUploadUrl(ctx.db, {
      filename: input.filename,
      contentType: input.contentType,
      bytes: input.bytes,
      uploaderId: ctx.user.id,
    }),
  ),

  createAssetUrl: adminProcedure.input(uploadRequest).mutation(({ ctx, input }) =>
    uploads.createUploadUrl(ctx.db, {
      filename: input.filename,
      contentType: input.contentType,
      bytes: input.bytes,
      uploaderId: ctx.user.id,
    }),
  ),

  status: protectedProcedure.input(byUploadId).query(({ ctx, input }) =>
    uploads.state(ctx.db, input.id),
  ),
});
