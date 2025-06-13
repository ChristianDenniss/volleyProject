import { z } from 'zod';

export const createArticleSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    content: z.string().min(240, { message: "Content is required, min 240 characters" }),
    imageUrl: z.string().url({ message: "Image URL is required and must be a valid URL" }),
    userId: z.number().int().positive(),  // Changed from authorId to userId
    summary: z.string().min(50, { message: "Summary is required, min 50 characters" }),
    likes: z.number().int().positive().default(0).optional(),
    approved: z.boolean().nullable().optional(),
});

export const updateArticleSchema = createArticleSchema.partial().extend({
    approved: z.boolean().optional(), // Allow true or false in updates
});
