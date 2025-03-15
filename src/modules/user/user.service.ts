import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { User } from './user.entity.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { DuplicateError } from '../../errors/DuplicateError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

export class UserService {
    private userRepository: Repository<User>;
    private readonly JWT_SECRET: string;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret';
    }
    
    // Simple password hashing using crypto
    private hashPassword(password: string): string {
        return crypto.createHash('sha256').update(password).digest('hex');
    }
    
    // Simple password verification
    private verifyPassword(plainPassword: string, hashedPassword: string): boolean {
        const hashedInput = this.hashPassword(plainPassword);
        return hashedInput === hashedPassword;
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

        // Hash the password with crypto
        const hashedPassword = this.hashPassword(password);

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
            user.password = this.hashPassword(password);
        }

        if (role) {
            if (!['admin', 'user', 'manager'].includes(role)) {
                throw new Error("Invalid role. Role must be admin, user, or manager");
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
        if (!user) throw new Error("Invalid username or password");

        const isPasswordValid = this.verifyPassword(password, user.password);
        if (!isPasswordValid) throw new Error("Invalid username or password");

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
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
        
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) throw new NotFoundError(`User with ID: ${userId} not found`);
            
        return user;
    }
}