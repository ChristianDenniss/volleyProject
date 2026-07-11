import { Request, Response } from 'express';
import { UserService, UserFilters } from './user.service.js';
import { parsePagination, toPaginatedResult } from '../../utils/pagination.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
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

    register = async (req: Request, res: Response): Promise<void> =>
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
            const msg = error instanceof Error ? error.message : "Failed to register user";

            if (
                msg.includes("required")      ||
                msg.includes("already")       ||
                msg.includes("must be")       ||
                msg.includes("Invalid")       ||
                msg.includes("Password")
            )
            {
                res.status(400).json({ error: msg });
            }
            else
            {
                console.error("Error registering user:", error);
                res.status(500).json({ error: "Failed to register user" });
            }
        }
    };

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { username, password } = req.body;
            const { user, token } = await this.userService.authenticateUser(username, password);

            const { password: _, ...userWithoutPassword } = user;

            setAuthCookies(res, token);

            res.json({ user: userWithoutPassword });
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                res.status(401).json({ error: "Invalid username or password" });
                return;
            }

            const errorMessage = error instanceof Error ? error.message : "Failed to login";

            if (errorMessage.includes("required")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error logging in:", error);
                res.status(500).json({ error: "Failed to login" });
            }
        }
    };

    logout = async (_req: Request, res: Response): Promise<void> => {
        clearAuthCookies(res);
        res.status(204).send();
    };

    changePassword = async (req: Request, res: Response): Promise<void> => {
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
            if (error instanceof UnauthorizedError) {
                res.status(401).json({ error: "Invalid username or password" });
                return;
            }

            const msg = error instanceof Error ? error.message : "Failed to change password";

            if (msg.includes("Password") || msg.includes("required")) {
                res.status(400).json({ error: msg });
            } else if (msg.includes("not found")) {
                res.status(404).json({ error: msg });
            } else {
                console.error("Error changing password:", error);
                res.status(500).json({ error: "Failed to change password" });
            }
        }
    };

    getPublicUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, USERS_DEFAULT_LIMIT);
            const filters = this.parseFilters(req);
            const [data, total] = await this.userService.getPublicUsers(pagination, filters);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ error: "Failed to fetch users" });
        }
    };

    getUserById = async (req: Request, res: Response): Promise<void> => {
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
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch user";

            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching user by ID:", error);
                res.status(500).json({ error: "Failed to fetch user" });
            }
        }
    };

    getProfile = async (req: Request, res: Response): Promise<void> =>
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
                const msg = error instanceof Error ? error.message : "Failed to fetch profile";

                if (msg.includes("not found"))
                {
                    res.status(404).json({ error: msg });
                }
                else
                {
                    console.error("Error fetching user profile:", error);
                    res.status(500).json({ error: "Failed to fetch profile" });
                }
            }
    };

    setRole = async (req: Request, res: Response): Promise<void> =>
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
            const msg = error instanceof Error ? error.message : "Failed to set role";

            if (msg.includes("Invalid")          ||
                msg.includes("not found")        ||
                msg.includes("Unauthorized")     ||
                msg.includes("privileges"))
            {
                res.status(403).json({ error: msg });
            }
            else
            {
                console.error("Error setting user role:", error);
                res.status(500).json({ error: "Failed to set role" });
            }
        }
    };
}
