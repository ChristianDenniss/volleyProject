import { Request, Response } from 'express';
import { UserService } from './user.service.ts';
import { OAuth } from '../../oauth.ts';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    getUrl = (options: OAuth) => {
        const url = new URL(options.AUTHORIZE_URL)
        url.searchParams.set("redirect_uri", options.CALLBACK)
        url.searchParams.set("client_id", options.ID)
        url.searchParams.set("client_secret", options.SECRET)
        url.searchParams.set("scope", options.SCOPES.join(","))
        url.searchParams.set("response_type", "code")        

        const built = url.toString()

        return async (_req: Request, res: Response): Promise<void> => {
            return res.redirect(built)
        }   
    }

    getCallback = (options: OAuth) => {
        return async (req: Request, res: Response): Promise<void> => {
            const code = req.query["code"]
            const isError = req.query["error"]
            if (!!isError) {
                res.status(500).send(`${isError}: description: ${req.query["description"]}`)
                return 
            }
            if (typeof code !== "string") {
                res.status(400).send(`unpexected code value`)
                return
            }

            const url = new URL(options.AUTHORIZE_URL)
            url.searchParams.set("redirect_uri", options.CALLBACK)
            url.searchParams.set("client_id", options.ID)
            url.searchParams.set("client_secret", options.SECRET)
            url.searchParams.set("code", code)
            url.searchParams.set("grant_type", "authorization_code")

            const built = url.toString()

            const result = await fetch(built, { headers: {["content-type"]: "application/x-www-form-urlencoded"} })
            const json = await result.json() as {
                access_token: string,
                refresh_token: string,
                token_type: string,
                expires_in: number,
                scope: string
            }
            // most likely token_type is bearer????
            if (json.token_type !== "Bearer") {
                res.status(500).send(`expected token_type 'Bearer' got ${json.token_type}`)
                return 
            }

            const userInfo = await fetch(options.GET_USER_INFO, {headers: {["Authorization"]: `${json.token_type} ${json.access_token}`}})
            const userInfoJson = await userInfo.json() as {
                "sub": string, // userid in stirng
                "name": string, // username
                "nickname": string, // displayname
                "preferred_username": string, // ignore i would say
                "created_at": null,
                "profile": string, // ignore, you can construct this yourself
                "picture": string, // url for their pfp
            }

            // lets get or get a user
            const userId = Number(userInfoJson.sub)
            const user = await this.userService.getProfile(userId).catch((err) => {
                return this.userService.createUser(userInfoJson.name, userId)
            })



            res.json({

            })
        }   
    }

    // Get all users (admin only)
    getUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const users = await this.userService.getAllUsers();
            
            // Remove passwords from response
            const usersWithoutPasswords = users.map(user => {
                const { ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
            
            res.json(usersWithoutPasswords);
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ error: "Failed to fetch users" });
        }
    };

    // Get user by ID
    getUserById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const user = await this.userService.getUserById(parseInt(id));

            // Remove password from response
            const { ...userWithoutPassword } = user;
            
            res.json(userWithoutPassword);
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

    // Update a user
    updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { username } = req.body;

            const updatedUser = await this.userService.updateUser(
                parseInt(id),
                username,
            );

            // Remove password from response
            const { ...userWithoutPassword } = updatedUser;
            
            res.json(userWithoutPassword);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update user";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else if (errorMessage.includes("required") || 
                       errorMessage.includes("already in use") ||
                       errorMessage.includes("Invalid")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error updating user:", error);
                res.status(500).json({ error: "Failed to update user" });
            }
        }
    };

    // Delete a user
    deleteUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.userService.deleteUser(parseInt(id));
            res.status(204).send();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error deleting user:", error);
                res.status(500).json({ error: "Failed to delete user" });
            }
        }
    };

    // Get current user profile (requires authentication)
    getProfile = async (req: Request, res: Response): Promise<void> =>
    {
            try
            {
                //  ID supplied by authenticateToken middleware
                const authUser = (req as any).user as { id?: number } | undefined;
    
                if (!authUser?.id)
                {
                    res.status(401).json({ error: "Unauthorized" });
                    return;
                }
    
                const user = await this.userService.getProfile(authUser.id);
    
                const { ...userWithoutPassword } = user;
    
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

    //  Delegate all logic to the service layer
    setRole = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            //  Authenticated requester
            const requester = (req as any).user as { id: number; role: "user" | "admin" | "superadmin" };
    
            //  Target and desired role
            const targetId    = parseInt(req.params.id);
            const desiredRole = req.body.role as "user" | "admin" | "superadmin";
    
            //  Call service – all rules enforced there
            const updated = await this.userService.changeUserRole(requester, targetId, desiredRole);
    
            //  Strip password
            const { ...userWithoutPassword } = updated;
    
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