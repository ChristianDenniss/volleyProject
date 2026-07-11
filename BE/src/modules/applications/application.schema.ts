import { z } from "zod";
import { httpUrlSchema } from "../../utils/urlSchema.js";

export const updateApplicationSchema = z.object({
    url: z.union([httpUrlSchema, z.literal(""), z.null()]).optional(),
    status: z.enum(["open", "closed"]).optional(),
});
