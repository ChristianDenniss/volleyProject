import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source.ts';
import { User } from './user.entity.ts';
import { MissingFieldError } from '../../errors/MissingFieldError.ts';
import { DuplicateError } from '../../errors/DuplicateError.ts';
import { NotFoundError } from '../../errors/NotFoundError.ts';
import { UnauthorizedError } from '../../errors/UnauthorizedError.ts';

export class UserService {
    private userRepository: Repository<User>;
    private readonly JWT_SECRET: string;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.JWT_SECRET = process.env.JWT_SECRET || '';
        if (!this.JWT_SECRET) {
            throw new Error("JWT_SECRET must be defined in environment variables");
        }
    }


    /**
     * Create a new user with validation
     */
    async createUser(username: string, userId: number, role: string = 'user'): Promise<User> {
        // Validation
        if (!username) throw new MissingFieldError("Username");
        

        // Check if user already exists
        const existingUser = await this.userRepository.findOne({
            where: [{ userId }, { userId }],
        });

        if (existingUser) {
            if (existingUser.userId === userId) 
            {
                throw new DuplicateError(`Username ${username} already in use`);
            } 
        }

        // Create new user
        const newUser = new User();
        newUser.username = username;
        newUser.userId = userId
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

        const user = await this.userRepository.findOneBy({ userId: id });
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
        role?: string
    ): Promise<User> {
        if (!id) throw new MissingFieldError("User ID");

        const user = await this.userRepository.findOneBy({ userId: id });
        if (!user) throw new NotFoundError(`User with ID:${id} not found`);

        // Check if username or email is already in use by another user
        if (username) {
            const existingUser = await this.userRepository.findOneBy({ username });
            if (existingUser && existingUser.userId !== id) {
                throw new DuplicateError(`Username ${username} is already in use`);
            }
            user.username = username;
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

        const user = await this.userRepository.findOneBy({ userId: id });
        if (!user) throw new NotFoundError(`User with ID:${id} not found`);

        await this.userRepository.remove(user);
    }

    /**
     * Get current user by ID
     */
    async getProfile(userId: number): Promise<User> {
        if (!userId) throw new MissingFieldError("User ID");
        
        const user = await this.userRepository.findOne({
            where: { userId: userId },
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
        if (requester.id === target.userId)
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
