import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { User } from './user.entity.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { DuplicateError } from '../../errors/DuplicateError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { logApiKeyOperation } from '../../middleware/logger.js';

// API Key interface
interface ApiKey {
    id: number;
    key: string;
    userId: number;
    createdAt: Date;
    lastUsed?: Date;
    isActive: boolean;
}

export class UserService {
    private userRepository: Repository<User>;
    private readonly JWT_SECRET: string;
    private apiKeys: Map<string, ApiKey> = new Map(); // In-memory storage for API keys

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.JWT_SECRET = process.env.JWT_SECRET || '';
        if (!this.JWT_SECRET) {
            throw new Error("JWT_SECRET must be defined in environment variables");
        }
    }

    // Hash password using bcrypt
    private async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    // Verify password using bcrypt
    private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }

    // Generate a secure API key
    private generateApiKey(): string {
        const crypto = require('crypto');
        return crypto.randomBytes(32).toString('base64');
    }

    // Store API key in memory (in production, you'd use a database)
    async storeApiKey(userId: number): Promise<string> {
        const apiKey = this.generateApiKey();
        const keyData: ApiKey = {
            id: Date.now(), // Simple ID generation
            key: apiKey,
            userId: userId,
            createdAt: new Date(),
            isActive: true
        };
        
        this.apiKeys.set(apiKey, keyData);
        
        // Log the API key generation
        logApiKeyOperation('GENERATE', userId, keyData.id.toString());
        console.log(`🔑 Generated API key for user ${userId}. Key ID: ${keyData.id}`);
        
        return apiKey;
    }

    // Validate API key
    async validateApiKey(apiKey: string): Promise<{ userId: number; role: string } | null> {
        const keyData = this.apiKeys.get(apiKey);
        
        if (!keyData || !keyData.isActive) {
            console.log(`❌ Invalid API key attempt: ${apiKey.substring(0, 8)}...`);
            return null;
        }

        // Update last used timestamp
        keyData.lastUsed = new Date();
        this.apiKeys.set(apiKey, keyData);

        // Log the API key usage
        logApiKeyOperation('VALIDATE', keyData.userId, keyData.id.toString());
        console.log(`🔑 API key validated for user ${keyData.userId}. Key ID: ${keyData.id}`);

        // Get user info
        try {
            const user = await this.getUserById(keyData.userId);
            return {
                userId: user.id,
                role: user.role
            };
        } catch (error) {
            console.log(`❌ User not found for API key. User ID: ${keyData.userId}`);
            return null;
        }
    }

    // Get all API keys for a user (admin only)
    async getUserApiKeys(userId: number): Promise<ApiKey[]> {
        const keys: ApiKey[] = [];
        for (const [key, keyData] of this.apiKeys.entries()) {
            if (keyData.userId === userId) {
                keys.push({ ...keyData, key: '***' + key.slice(-8) }); // Only show last 8 chars
            }
        }
        
        // Log the API key listing
        logApiKeyOperation('LIST', userId);
        console.log(`🔑 Listed ${keys.length} API keys for user ${userId}`);
        
        return keys;
    }

    // Revoke API key
    async revokeApiKey(apiKey: string, userId: number): Promise<boolean> {
        const keyData = this.apiKeys.get(apiKey);
        
        if (keyData && keyData.userId === userId) {
            keyData.isActive = false;
            this.apiKeys.set(apiKey, keyData);
            
            // Log the API key revocation
            logApiKeyOperation('REVOKE', userId, keyData.id.toString());
            console.log(`🔑 API key revoked for user ${userId}. Key ID: ${keyData.id}`);
            
            return true;
        }
        
        console.log(`❌ Failed to revoke API key for user ${userId}`);
        return false;
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
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("Invalid email format");
        }

        // Check if user already exists
        const existingUser = await this.userRepository.findOne({
            where: [{ username }, { email }],
        });

        if (existingUser) {
            if (existingUser.username === username) 
            {
                throw new DuplicateError(`Username ${username} already in use`);
            } 
            else 
            {
                throw new DuplicateError(`Email ${email} already in use`);
            }
        }

        // Hash the password
        const hashedPassword = await this.hashPassword(password);

        // Create new user
        const newUser = new User();
        newUser.username = username;
        newUser.email = email;
        newUser.password = hashedPassword;
        newUser.role = role;

        return this.userRepository.save(newUser);
    }

    /**
     * Get all users
     */
    async getAllUsers(): Promise<User[]> {
        return this.userRepository.find();
    }

    /**
     * Get user by ID with validation
     */
    async getUserById(id: number): Promise<User> {
        if (!id) throw new MissingFieldError("User ID");

        const user = await this.userRepository.findOneBy({ id });
        if (!user) throw new NotFoundError(`User with ID:${id} not found`);

        return user;
    }

    /**
     * Get user by username with validation
     */
    async getUserByUsername(username: string): Promise<User> {
        if (!username) throw new MissingFieldError("Username");

        const user = await this.userRepository.findOneBy({ username });
        if (!user) throw new NotFoundError(`User with username ${username} not found`);

        return user;
    }

    /**
     * Update a user with validation
     */
    async updateUser(
        id: number,
        username?: string,
        email?: string,
        password?: string,
        role?: string
    ): Promise<User> {
        if (!id) throw new MissingFieldError("User ID");

        const user = await this.userRepository.findOneBy({ id });
        if (!user) throw new NotFoundError(`User with ID:${id} not found`);

        // Check if username or email is already in use by another user
        if (username) {
            const existingUser = await this.userRepository.findOneBy({ username });
            if (existingUser && existingUser.id !== id) {
                throw new DuplicateError(`Username ${username} is already in use`);
            }
            user.username = username;
        }

        if (email) {
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error("Invalid email format");
            }
            
            const existingUser = await this.userRepository.findOneBy({ email });
            if (existingUser && existingUser.id !== id) {
                throw new DuplicateError(`Email ${email} is already in use`);
            }
            user.email = email;
        }

        if (password) {
            if (password.length < 6) throw new Error("Password must be at least 6 characters long");
            user.password = await this.hashPassword(password);
        }

        if (role) {
            if (!['admin', 'user', 'superadmin'].includes(role)) {
                throw new Error("Invalid role. Role must be admin, user, or superadmin");
            }
            user.role = role;
        }

        return this.userRepository.save(user);
    }

    /**
     * Delete a user with validation
     */
    async deleteUser(id: number): Promise<void> {
        if (!id) throw new MissingFieldError("User ID");

        const user = await this.userRepository.findOneBy({ id });
        if (!user) throw new NotFoundError(`User with ID:${id} not found`);

        await this.userRepository.remove(user);
    }

    /**
     * Authenticate user with validation
     */
    async authenticateUser(username: string, password: string): Promise<{ user: User, token: string }> {
        if (!username) throw new MissingFieldError("Username");
        if (!password) throw new MissingFieldError("Password");

        const user = await this.userRepository.findOneBy({ username });
        if (!user) throw new UnauthorizedError("Invalid username or password");

        const isPasswordValid = await this.verifyPassword(password, user.password);
        if (!isPasswordValid) throw new UnauthorizedError("Invalid username or password");

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, 
                username: user.username, 
                role: user.role 
            },

            this.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return { user, token };
    }

    /**
     * Get current user by ID
     */
    async getProfile(userId: number): Promise<User> {
        if (!userId) throw new MissingFieldError("User ID");
        
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['articles']
        });
        if (!user) throw new NotFoundError(`User with ID: ${userId} not found`);
            
        return user;
    }

    //  Change a user’s role, applying all privilege rules internally
    async changeUserRole(
        requester: { id: number; role: "user" | "admin" | "superadmin" },
        targetId:  number,
        desired:   "user" | "admin" | "superadmin"
    ): Promise<User>
    {
        //  Validate desired value
        if (!["user", "admin", "superadmin"].includes(desired))
        {
            throw new Error("Invalid role value");
        }

        //  Fetch the target
        const target = await this.getUserById(targetId); // re-use existing helper

        //  Disallow self-changes
        if (requester.id === target.id)
        {
            throw new UnauthorizedError("You cannot change your own role");
        }

        /* ────────  RULE MATRIX  ──────── */

        switch (requester.role)
        {
            case "admin":
            {
                //  Admin may only promote a plain user → admin
                const allowed = target.role === "user" && desired === "admin";
                if (!allowed)
                {
                    throw new UnauthorizedError("Insufficient privileges");
                }
                break;
            }

            case "superadmin":
            {
                //  Superadmin cannot touch another superadmin (unless no-op)
                if (target.role === "superadmin" && desired !== "superadmin")
                {
                    throw new UnauthorizedError("Cannot modify another superadmin");
                }
                //  All other changes are allowed:
                //  • user   → admin / superadmin
                //  • admin  → superadmin / user
                break;
            }

            default:
                throw new UnauthorizedError("Insufficient privileges");
        }

        /* ────────  APPLY CHANGE  ──────── */

        //  No operation needed if role already the same
        if (target.role === desired)
        {
            return target;
        }

        target.role = desired;
        return this.userRepository.save(target);
    }

}
