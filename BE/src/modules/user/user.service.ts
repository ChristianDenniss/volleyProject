import { Repository, ILike, FindOptionsWhere } from "typeorm";
import { User } from "./user.entity.js";
import { RoleAuditLog } from "./role-audit-log.entity.js";
import { AppDataSource } from "../../db/data-source.js";
import bcrypt from "bcryptjs";
import { MissingFieldError } from "../../errors/MissingFieldError.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { UnauthorizedError } from "../../errors/UnauthorizedError.js";
import { PaginationParams } from "../../utils/pagination.js";
import {
    signUserToken,
    normalizeRobloxUsername,
    ALLOWED_JWT_ROLES,
    type AllowedJwtRole,
} from "../../middleware/authValidation.js";
import { validatePasswordStrength } from "../../utils/passwordPolicy.js";
import { Players } from "../players/player.entity.js";
import { GameStaff } from "../games/game-staff.entity.js";

export interface UserFilters {
    search?: string;
    role?: string;
}

export interface RoleChangeAuditContext {
    ip?: string;
}

const ALL_ROLES = [...ALLOWED_JWT_ROLES];

export class UserService {
    private userRepository: Repository<User>;
    private auditLogRepository: Repository<RoleAuditLog>;
    private playerRepository: Repository<Players>;
    private staffRepository: Repository<GameStaff>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.auditLogRepository = AppDataSource.getRepository(RoleAuditLog);
        this.playerRepository = AppDataSource.getRepository(Players);
        this.staffRepository = AppDataSource.getRepository(GameStaff);
    }

    private async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }

    toPublicUser(user: User): Record<string, unknown> {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            robloxUserId: user.robloxUserId ?? null,
            robloxUsername: user.robloxUsername ?? null,
            hasPassword: Boolean(user.password),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            articles: (user as User & { articles?: unknown }).articles,
        };
    }

    async createUser(username: string, email: string, password: string, role: string = "user"): Promise<User> {
        if (!username) throw new MissingFieldError("Username");
        if (!email) throw new MissingFieldError("Email");
        validatePasswordStrength(password);

        const existingUser = await this.userRepository.findOne({
            where: [{ username }, { email }],
        });

        if (existingUser) {
            throw new ConflictError("User already exists");
        }

        const user = new User();
        user.username = username;
        user.email = email;
        user.password = await this.hashPassword(password);
        user.role = role;

        return await this.userRepository.save(user);
    }

    private buildWhere(filters: UserFilters): FindOptionsWhere<User> {
        const where: FindOptionsWhere<User> = {};
        if (filters.search) where.username = ILike(`%${filters.search}%`);
        if (filters.role) where.role = filters.role as User["role"];
        return where;
    }

    async getAllUsers(pagination: PaginationParams, filters: UserFilters = {}): Promise<[User[], number]> {
        return await this.userRepository.findAndCount({
            where: this.buildWhere(filters),
            select: ["id", "username", "email", "role", "robloxUsername", "robloxUserId", "createdAt"],
            skip: pagination.skip,
            take: pagination.take,
        });
    }

    async getPublicUsers(pagination: PaginationParams, filters: UserFilters = {}): Promise<[User[], number]> {
        return await this.userRepository.findAndCount({
            where: this.buildWhere(filters),
            select: ["id", "username", "role", "robloxUsername", "createdAt"],
            skip: pagination.skip,
            take: pagination.take,
        });
    }

    async getUserById(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            select: ["id", "username", "role", "robloxUsername", "robloxUserId", "createdAt"],
        });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        return user;
    }

    async authenticateUser(username: string, password: string): Promise<{ user: User; token: string }> {
        if (!username) throw new MissingFieldError("Username");
        if (!password) throw new MissingFieldError("Password");

        const passwordUser = await this.userRepository.findOne({
            where: { username },
            select: ["id", "password"],
        });

        if (!passwordUser?.password || !(await this.verifyPassword(password, passwordUser.password))) {
            throw new UnauthorizedError("Invalid username or password");
        }

        const user = await this.userRepository.findOne({
            where: { username },
            select: ["id", "username", "email", "role", "createdAt", "tokenVersion", "robloxUserId", "robloxUsername"],
        });

        if (!user) {
            throw new UnauthorizedError("Invalid username or password");
        }

        return { user, token: signUserToken(user) };
    }

    async changePassword(
        userId: number,
        currentPassword: string,
        newPassword: string
    ): Promise<{ user: User; token: string }> {
        validatePasswordStrength(newPassword);

        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ["id", "username", "email", "password", "role", "tokenVersion", "createdAt", "updatedAt", "robloxUserId", "robloxUsername"],
        });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        if (!user.password) {
            throw new UnauthorizedError("This account has no password. Set one from profile after SSO signup, or use Roblox login.");
        }

        if (!(await this.verifyPassword(currentPassword, user.password))) {
            throw new UnauthorizedError("Invalid username or password");
        }

        user.password = await this.hashPassword(newPassword);
        user.tokenVersion += 1;
        const saved = await this.userRepository.save(user);

        return { user: saved, token: signUserToken(saved) };
    }

    async getProfile(userId: number): Promise<Record<string, unknown>> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["articles"],
            select: [
                "id",
                "username",
                "email",
                "role",
                "tokenVersion",
                "robloxUserId",
                "robloxUsername",
                "password",
                "createdAt",
                "updatedAt",
            ],
        });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        const publicUser = this.toPublicUser(user);
        publicUser.staffedGames = await this.getStaffedGames(userId);
        return publicUser;
    }

    private async getStaffedGames(userId: number): Promise<Record<string, unknown>[]> {
        const credits = await this.staffRepository.find({
            where: { userId },
            relations: ["game", "game.teams"],
        });

        return credits
            .slice()
            .sort((a, b) => {
                const aTime = a.game?.date ? new Date(a.game.date).getTime() : 0;
                const bTime = b.game?.date ? new Date(b.game.date).getTime() : 0;
                return bTime - aTime;
            })
            .map((credit) => ({
                role: credit.role,
                game: {
                    id: credit.game.id,
                    name: credit.game.name,
                    date: credit.game.date,
                    stage: credit.game.stage,
                    videoUrl: credit.game.videoUrl,
                    teams: (credit.game.teams ?? []).map((team) => ({
                        id: team.id,
                        name: team.name,
                    })),
                },
            }));
    }

    async linkPlayersToUser(user: User): Promise<void> {
        if (!user.robloxUsername && !user.robloxUserId) return;

        const qb = this.playerRepository.createQueryBuilder("player");
        if (user.robloxUserId) {
            qb.where("player.robloxUserId = :rid", { rid: user.robloxUserId });
        }
        if (user.robloxUsername) {
            const clause = "LOWER(player.robloxUsername) = :rname";
            if (user.robloxUserId) {
                qb.orWhere(clause, { rname: normalizeRobloxUsername(user.robloxUsername) });
            } else {
                qb.where(clause, { rname: normalizeRobloxUsername(user.robloxUsername) });
            }
        }

        const players = await qb.getMany();
        for (const player of players) {
            player.userId = user.id;
            if (user.robloxUserId) player.robloxUserId = user.robloxUserId;
            if (user.robloxUsername) player.robloxUsername = normalizeRobloxUsername(user.robloxUsername);
            await this.playerRepository.save(player);
        }
    }

    async connectRoblox(
        userId: number,
        robloxUserId: string,
        robloxUsername: string
    ): Promise<User> {
        const normalized = normalizeRobloxUsername(robloxUsername);

        const taken = await this.userRepository.findOne({
            where: [{ robloxUserId }, { robloxUsername: normalized }],
        });
        if (taken && taken.id !== userId) {
            throw new ConflictError("This Roblox account is already linked to another user");
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundError("User not found");

        user.robloxUserId = robloxUserId;
        user.robloxUsername = normalized;
        const saved = await this.userRepository.save(user);
        await this.linkPlayersToUser(saved);
        return saved;
    }

    async unlinkRoblox(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ["id", "username", "email", "password", "role", "tokenVersion", "robloxUserId", "robloxUsername", "createdAt", "updatedAt"],
        });
        if (!user) throw new NotFoundError("User not found");

        if (!user.password) {
            throw new ConflictError("Cannot unlink Roblox from an account with no password. Set a password first.");
        }

        await this.playerRepository
            .createQueryBuilder()
            .update(Players)
            .set({ userId: null })
            .where("userId = :userId", { userId })
            .execute();

        user.robloxUserId = null;
        user.robloxUsername = null;
        return await this.userRepository.save(user);
    }

    async findByRobloxUserId(robloxUserId: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { robloxUserId },
            select: ["id", "username", "email", "role", "tokenVersion", "robloxUserId", "robloxUsername", "createdAt"],
        });
    }

    async createUserFromRoblox(robloxUserId: string, robloxUsername: string): Promise<{ user: User; token: string }> {
        const normalized = normalizeRobloxUsername(robloxUsername);
        const existing = await this.findByRobloxUserId(robloxUserId);
        if (existing) {
            return { user: existing, token: signUserToken(existing) };
        }

        let username = normalized.slice(0, 24) || `roblox_${robloxUserId}`;
        const takenName = await this.userRepository.findOne({ where: { username } });
        if (takenName) {
            username = `${username}_${robloxUserId.slice(-4)}`;
        }

        const user = new User();
        user.username = username;
        user.email = null;
        user.password = null;
        user.role = "user";
        user.robloxUserId = robloxUserId;
        user.robloxUsername = normalized;

        const saved = await this.userRepository.save(user);
        await this.linkPlayersToUser(saved);
        return { user: saved, token: signUserToken(saved) };
    }

    async issueTokenForUser(userId: number): Promise<{ user: User; token: string }> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ["id", "username", "email", "role", "tokenVersion", "robloxUserId", "robloxUsername", "createdAt"],
        });
        if (!user) throw new NotFoundError("User not found");
        return { user, token: signUserToken(user) };
    }

    async promoteRoleIfUser(
        userId: number,
        desired: "captain" | "vice_captain" | "court_captain",
        actorId: number,
        audit?: RoleChangeAuditContext
    ): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) return null;
        if (user.role === "admin" || user.role === "superadmin") return user;
        if (user.role === "captain" && desired !== "captain") return user;
        if (user.role === desired) return user;

        const oldRole = user.role;
        user.role = desired;
        user.tokenVersion += 1;
        const saved = await this.userRepository.save(user);

        const auditEntry = new RoleAuditLog();
        auditEntry.actorId = actorId;
        auditEntry.targetId = userId;
        auditEntry.oldRole = oldRole;
        auditEntry.newRole = desired;
        auditEntry.ip = audit?.ip ?? null;
        await this.auditLogRepository.save(auditEntry);

        return saved;
    }

    async changeUserRole(
        requester: { id: number; role: string },
        targetId: number,
        desired: AllowedJwtRole,
        audit?: RoleChangeAuditContext
    ): Promise<User> {
        if (requester.role !== "superadmin") {
            throw new UnauthorizedError("Only superadmin can change user roles");
        }

        if (!ALL_ROLES.includes(desired)) {
            throw new Error(`Invalid role. Role must be one of: ${ALL_ROLES.join(", ")}`);
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

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const saved = await queryRunner.manager.save(target);

            const auditEntry = new RoleAuditLog();
            auditEntry.actorId = requester.id;
            auditEntry.targetId = targetId;
            auditEntry.oldRole = oldRole;
            auditEntry.newRole = desired;
            auditEntry.ip = audit?.ip ?? null;
            await queryRunner.manager.save(auditEntry);

            await queryRunner.commitTransaction();

            console.info("[AUDIT] role_change", {
                actorId: requester.id,
                targetId,
                oldRole,
                newRole: desired,
                ip: audit?.ip ?? null,
                timestamp: new Date().toISOString(),
            });

            return saved;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }
}
