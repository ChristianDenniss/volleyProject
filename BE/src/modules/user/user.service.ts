import { Repository } from "typeorm";
import { User } from "./user.entity.js";
import { AppDataSource } from "../../db/data-source.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MissingFieldError } from "../../errors/MissingFieldError.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { UnauthorizedError } from "../../errors/UnauthorizedError.js";

export class UserService {
    private userRepository: Repository<User>;
    private readonly JWT_SECRET: string;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.JWT_SECRET = process.env.JWT_SECRET || '';
    }

    private async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }

    /**
     * Create a new user with validation
     */
    async createUser(username: string, email: string, password: string, role: string = 'user'): Promise<User> {
        // Validation
        if (!username) throw new MissingFieldError("Username");
        if (!email) throw new MissingFieldError("Email");
        if (!password) throw new MissingFieldError("Password");
        if (password.length < 6) throw new Error("Password must be at least 6 characters long");

        // Check if user already exists
        const existingUser = await this.userRepository.findOne({
            where: [
                { username },
                { email }
            ]
        });

        if (existingUser) {
            throw new ConflictError("User already exists");
        }

        // Hash password
        const hashedPassword = await this.hashPassword(password);

        // Create user
        const user = new User();
        user.username = username;
        user.email = email;
        user.password = hashedPassword;
        user.role = role;

        return await this.userRepository.save(user);
    }

    /**
     * Get all users
     */
    async getAllUsers(): Promise<User[]> {
        return await this.userRepository.find({
            select: ['id', 'username', 'email', 'role', 'createdAt']
        });
    }


    async getPublicUsers(): Promise<User[]> {
        return await this.userRepository.find({
            select: ['id', 'username', 'role', 'createdAt']
        });
    }

    /**
     * Get user by ID
     */
    async getUserById(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            select: ["id", "username", "role", "createdAt"]
        });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        return user;
    }

    /**
     * Get user by username
     */
    async getUserByUsername(username: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { username },
            select: ["id", "username", "role", "createdAt"]
        });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        return user;
    }
    async selectPasswordByUserId(username: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { username },
            select: ["password"]
        });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        return user;
    }


    /**
     * Update user
     */
    async updateUser(
        id: number,
        username?: string,
        email?: string,
        password?: string,
        role?: string
    ): Promise<User> {
        const user = await this.getUserById(id);

        if (username) user.username = username;
        if (email) user.email = email;
        if (password) {
            if (password.length < 6) {
                throw new Error("Password must be at least 6 characters long");
            }
            user.password = await this.hashPassword(password);
        }
        // NEVER 
        if (role) {
            if (!['admin', 'user'].includes(role)) {
                throw new Error("Invalid role. Role must be admin or user");
            }
            user.role = role;
        }

        return await this.userRepository.save(user);
    }

    /**
     * Delete user
     */
    async deleteUser(id: number): Promise<void> {
        const user = await this.getUserById(id);
        await this.userRepository.remove(user);
    }

    /**
     * Authenticate user and return JWT token
     */
    async authenticateUser(username: string, password: string): Promise<{ user: User, token: string }> {
        const user = await this.selectPasswordByUserId(username);

        const isValidPassword = await this.verifyPassword(password, user.password);
        if (!isValidPassword) {
            throw new UnauthorizedError("Invalid credentials");
        }

        // Generate JWT token with longer expiration
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            },
            this.JWT_SECRET,
            { expiresIn: '7d' } // Extended from 24h to 7 days
        );

        return { user, token };
    }

    /**
     * Get user profile
     */
    async getProfile(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["articles"]
        });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        return user;
    }

    /**
     * Change user role with proper authorization
     */
    async changeUserRole(
        requester: { id: number; role: "user" | "admin" | "superadmin" },
        targetId:  number,
        desired:   "user" | "admin" | "superadmin"
    ): Promise<User>
    {
        //  Validate desired role
        if (!["user", "admin", "superadmin"].includes(desired))
            throw new Error("Invalid role. Role must be user, admin, or superadmin");

        //  Get target user
        const target = await this.getUserById(targetId);

        //  Authorization logic
        switch (requester.role)
        {
            case "user":
                throw new UnauthorizedError("Users cannot modify roles");

            case "admin":
                //  Admin may only promote a plain user → admin
                const allowed = target.role === "user" && desired === "admin";
                if (!allowed)
                    throw new UnauthorizedError("Admin can only promote users to admin");

            case "superadmin":
                //  Superadmin cannot touch another superadmin (unless no-op)
                if (target.role === "superadmin" && desired !== "superadmin")
                    throw new UnauthorizedError("Cannot modify another superadmin");

                //  • user   → admin / superadmin
                //  • admin  → superadmin / user
                //  • superadmin → superadmin (no-op)
                break;
        }

        //  Update role
        target.role = desired;
        return await this.userRepository.save(target);
    }
}
