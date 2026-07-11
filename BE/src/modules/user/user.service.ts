import { Repository, ILike, FindOptionsWhere } from "typeorm";
import { User } from "./user.entity.js";
import { RoleAuditLog } from "./role-audit-log.entity.js";
import { AppDataSource } from "../../db/data-source.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MissingFieldError } from "../../errors/MissingFieldError.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { UnauthorizedError } from "../../errors/UnauthorizedError.js";
import { PaginationParams } from "../../utils/pagination.js";
import { getJwtSecret } from "../../middleware/authValidation.js";
import { validatePasswordStrength } from "../../utils/passwordPolicy.js";

export interface UserFilters {
    search?: string;
    role?: string;
}

export interface RoleChangeAuditContext {
    ip?: string;
}

export class UserService {
    private userRepository: Repository<User>;
    private auditLogRepository: Repository<RoleAuditLog>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.auditLogRepository = AppDataSource.getRepository(RoleAuditLog);
    }

    private async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }

    async createUser(username: string, email: string, password: string, role: string = 'user'): Promise<User> {
        if (!username) throw new MissingFieldError("Username");
        if (!email) throw new MissingFieldError("Email");
        validatePasswordStrength(password);

        const existingUser = await this.userRepository.findOne({
            where: [
                { username },
                { email }
            ]
        });

        if (existingUser) {
            throw new ConflictError("User already exists");
        }

        const hashedPassword = await this.hashPassword(password);

        const user = new User();
        user.username = username;
        user.email = email;
        user.password = hashedPassword;
        user.role = role;

        return await this.userRepository.save(user);
    }

    private buildWhere(filters: UserFilters): FindOptionsWhere<User> {
        const where: FindOptionsWhere<User> = {};
        if (filters.search) where.username = ILike(`%${filters.search}%`);
        if (filters.role) where.role = filters.role as User['role'];
        return where;
    }

    async getAllUsers(pagination: PaginationParams, filters: UserFilters = {}): Promise<[User[], number]> {
        return await this.userRepository.findAndCount({
            where: this.buildWhere(filters),
            select: ['id', 'username', 'email', 'role', 'createdAt'],
            skip: pagination.skip,
            take: pagination.take
        });
    }

    async getPublicUsers(pagination: PaginationParams, filters: UserFilters = {}): Promise<[User[], number]> {
        return await this.userRepository.findAndCount({
            where: this.buildWhere(filters),
            select: ['id', 'username', 'role', 'createdAt'],
            skip: pagination.skip,
            take: pagination.take
        });
    }

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

    async authenticateUser(username: string, password: string): Promise<{ user: User, token: string }> {
        if (!username) throw new MissingFieldError("Username");
        if (!password) throw new MissingFieldError("Password");

        const passwordUser = await this.userRepository.findOne({
            where: { username },
            select: ["password"],
        });

        if (!passwordUser || !(await this.verifyPassword(password, passwordUser.password))) {
            throw new UnauthorizedError("Invalid username or password");
        }

        const user = await this.userRepository.findOne({
            where: { username },
            select: ["id", "username", "role", "createdAt", "tokenVersion"],
        });

        if (!user) {
            throw new UnauthorizedError("Invalid username or password");
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                tokenVersion: user.tokenVersion,
            },
            getJwtSecret(),
            { expiresIn: '7d' }
        );

        return { user, token };
    }

    async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{ user: User; token: string }> {
        validatePasswordStrength(newPassword);

        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ["id", "username", "email", "password", "role", "tokenVersion", "createdAt", "updatedAt"],
        });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        if (!(await this.verifyPassword(currentPassword, user.password))) {
            throw new UnauthorizedError("Invalid username or password");
        }

        user.password = await this.hashPassword(newPassword);
        user.tokenVersion += 1;
        const saved = await this.userRepository.save(user);

        const token = jwt.sign(
            {
                id: saved.id,
                username: saved.username,
                role: saved.role,
                tokenVersion: saved.tokenVersion,
            },
            getJwtSecret(),
            { expiresIn: '7d' }
        );

        const { password: _password, ...userWithoutPassword } = saved;
        return { user: userWithoutPassword as User, token };
    }

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

    async changeUserRole(
        requester: { id: number; role: "user" | "admin" | "superadmin" },
        targetId:  number,
        desired:   "user" | "admin" | "superadmin",
        audit?:    RoleChangeAuditContext
    ): Promise<User>
    {
        if (requester.role !== "superadmin") {
            throw new UnauthorizedError("Only superadmin can change user roles");
        }

        if (!["user", "admin", "superadmin"].includes(desired)) {
            throw new Error("Invalid role. Role must be user, admin, or superadmin");
        }

        const target = await this.userRepository.findOne({ where: { id: targetId } });

        if (!target) {
            throw new NotFoundError("User not found");
        }

        if (target.role === "superadmin" && desired !== "superadmin") {
            throw new UnauthorizedError("Cannot modify another superadmin");
        }

        const oldRole = target.role;
        target.role = desired;
        target.tokenVersion += 1;
        const saved = await this.userRepository.save(target);

        const auditEntry = new RoleAuditLog();
        auditEntry.actorId = requester.id;
        auditEntry.targetId = targetId;
        auditEntry.oldRole = oldRole;
        auditEntry.newRole = desired;
        auditEntry.ip = audit?.ip ?? null;
        await this.auditLogRepository.save(auditEntry);

        console.info("[AUDIT] role_change", {
            actorId: requester.id,
            targetId,
            oldRole,
            newRole: desired,
            ip: audit?.ip ?? null,
            timestamp: new Date().toISOString(),
        });

        return saved;
    }
}
