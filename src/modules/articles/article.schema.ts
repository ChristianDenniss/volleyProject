import { z } from 'zod';

export const createArticleSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    content: z.string().min(240, { message: "Content is required, min 240 characters" }),
    imageUrl: z.string().min(1, { message: "Image URL is required" }),
    authorId: z.number().int().positive(),
    summary: z.string().min(50, { message: "Summary is required, min 50 characters" }),
    likes: z.number().int().positive().default(0).optional(),
});

export const updateArticleSchema = createArticleSchema.partial().extend({
    id: z.number().int().positive(),
});

