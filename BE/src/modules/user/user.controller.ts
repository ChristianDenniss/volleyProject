import { Request, Response, NextFunction } from 'express';
import { UserService, UserFilters } from './user.service.js';
import { parsePagination, toPaginatedResult } from '../../utils/pagination.js';
import { setAuthCookies, clearAuthCookies } from '../../middleware/authCookie.js';

const USERS_DEFAULT_LIMIT = 10;

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    private parseFilters(req: Request): UserFilters {
        const { search, role } = req.query;
        return {
            search: typeof search === 'string' && search.length > 0 ? search : undefined,
            role: typeof role === 'string' && role.length > 0 ? role : undefined,
        };
    }

    register = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const { username, email, password } = req.body;

            const newUser = await this.userService.createUser(
                username,
                email,
                password,
                "user"
            );

            const { password: _p, ...userWithoutPassword } = newUser;

            res.status(201).json(userWithoutPassword);
        }
        catch (error)
        {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { username, password } = req.body;
            const { user, token } = await this.userService.authenticateUser(username, password);

            const { password: _, ...userWithoutPassword } = user;

            setAuthCookies(res, token);

            res.json({ user: userWithoutPassword });
        } catch (error) {
            next(error);
        }
    };

    logout = async (_req: Request, res: Response): Promise<void> => {
        clearAuthCookies(res);
        res.status(204).send();
    };

    changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user;

            if (!authUser?.id) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const { currentPassword, newPassword } = req.body;
            const { user, token } = await this.userService.changePassword(
                authUser.id,
                currentPassword,
                newPassword
            );

            setAuthCookies(res, token);

            const { password: _, ...userWithoutPassword } = user;
            res.json({ user: userWithoutPassword });
        } catch (error) {
            next(error);
        }
    };

    getPublicUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, USERS_DEFAULT_LIMIT);
            const filters = this.parseFilters(req);
            const [data, total] = await this.userService.getPublicUsers(pagination, filters);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const targetId = parseInt(req.params.id);
            const authUser = req.user;

            if (!authUser?.id) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const isSelf = authUser.id === targetId;
            const isPrivileged = authUser.role === "admin" || authUser.role === "superadmin";

            if (!isSelf && !isPrivileged) {
                res.status(403).json({ error: "Forbidden" });
                return;
            }

            res.json(await this.userService.getUserById(targetId));
        } catch (error) {
            next(error);
        }
    };

    getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
            try
            {
                const authUser = req.user

                if (!authUser?.id)
                {
                    res.status(401).json({ error: "Unauthorized" });
                    return;
                }

                const user = await this.userService.getProfile(authUser.id);

                const { password, ...userWithoutPassword } = user;

                res.json(userWithoutPassword);
            }
            catch (error)
            {
                next(error);
            }
    };

    setRole = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
    {
        try
        {
            const requester = (req as any).user as { id: number; role: "user" | "admin" | "superadmin" };

            const targetId    = parseInt(req.params.id);
            const desiredRole = req.body.role as "user" | "admin" | "superadmin";

            const updated = await this.userService.changeUserRole(
                requester,
                targetId,
                desiredRole,
                { ip: req.ip ?? req.socket.remoteAddress }
            );

            const { password, ...userWithoutPassword } = updated;

            res.json(userWithoutPassword);
        }
        catch (error)
        {
            next(error);
        }
    };
}
