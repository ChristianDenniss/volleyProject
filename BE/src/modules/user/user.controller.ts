import { Request, Response } from 'express';
import { UserService } from './user.service.ts';
import { OAuth } from '../../oauth.ts';
import { log } from 'console';
import { User } from './user.entity.ts';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    getUrl = (options: OAuth) => {
        const url = new URL(options.AUTHORIZE_URL)
        url.searchParams.set("redirect_uri", options.CALLBACK)
        url.searchParams.set("client_id", options.ID)
        url.searchParams.set("scope", options.SCOPES.join(" "))
        url.searchParams.set("response_type", "code")        

        const built = url.toString()

        return async (_req: Request, res: Response): Promise<void> => {
            log(url.toString())
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

            // const url = new URL(options.TOKEN_URL)
            // url.searchParams.set("client_id", options.ID)
            // url.searchParams.set("client_secret", options.SECRET)
            // url.searchParams.set("code", code)
            // url.searchParams.set("scope", options.SCOPES.join(" "))
            // url.searchParams.set("grant_type", "authorization_code")

            // const built = url.toString()

            
            const formData = new URLSearchParams()
            formData.set("client_id", options.ID)
            formData.set("client_secret", options.SECRET)
            formData.set("code", code)
            formData.set("scope", options.SCOPES.join(" "))
            formData.set("grant_type", "authorization_code")

            const result = await fetch(options.TOKEN_URL, { 
                method: "POST", 
                body: formData.toString(),
                headers: {["Content-Type"]: "application/x-www-form-urlencoded"} 
            })

            if (result.status !== 200) {
                res.status(500).send("got unexpected response")
                return 
            }
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
                "name": string, // displayname LMFAOO
                "nickname": string, // displayname
                "preferred_username": string, // actual username
                "created_at": null,
                "profile": string, // ignore, you can construct this yourself
                "picture": string, // url for their pfp
            }

            // lets get or get a user
            const userId = Number(userInfoJson.sub)
            let user: User | "new" = await this.userService.getProfile(userId).catch((err) => {
                console.log(err)
                return "new"
            })

            if (user === "new") {
                user = await this.userService.createUser({
                    displayName: userInfoJson.nickname,
                    userId: userId,
                    username: userInfoJson.preferred_username,
                    img: userInfoJson.picture
                })
            } else {
                user = await this.userService.updateUser({
                    displayName: userInfoJson.nickname,
                    userId: userId,
                    username: userInfoJson.preferred_username,
                    img: userInfoJson.picture
                })
            }

            res.json({
                user    
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