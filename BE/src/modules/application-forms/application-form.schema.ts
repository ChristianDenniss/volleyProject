import { z } from "zod";

export const updateApplicationFormSchema = z.object({
    url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
    status: z.enum(["open", "closed"]).optional(),
});
