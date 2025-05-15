import { z } from 'zod';

export const createUserSchema = z.object({
    username: z.string().min(3, { message: "Username is required, longer than 3 characters" }),
    password: z.string().min(5, { message: "Password is required, longer than 5 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    role: z.enum(['superadmin', 'admin', 'user', 'guest'], { message: "Role must be either 'superadmin', 'admin' or 'user'" }),
});

export const updateUserSchema = createUserSchema.partial().extend({
    id: z.number().int().positive(),
});

