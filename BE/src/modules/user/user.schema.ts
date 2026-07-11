import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '../../utils/passwordPolicy.js';

const passwordSchema = z.string()
    .min(PASSWORD_MIN_LENGTH, { message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` })
    .regex(/[A-Z]/, { message: "Password must include an uppercase letter" })
    .regex(/[a-z]/, { message: "Password must include a lowercase letter" })
    .regex(/\d/, { message: "Password must include a number" });

export const createUserSchema = z.object({
    username: z.string().min(3, { message: "Username is required, longer than 3 characters" }),
    password: passwordSchema,
    email: z.string().email({ message: "Invalid email address" }),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, { message: "Current password is required" }),
    newPassword: passwordSchema,
});

export const changeUserRoleSchema = z.object({
    role: z.enum(['user', 'admin', 'superadmin'], {
        message: "Role must be user, admin, or superadmin",
    }),
});
