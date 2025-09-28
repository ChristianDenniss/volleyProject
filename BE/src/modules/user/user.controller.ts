import { Request, Response } from 'express';
import { UserService } from './user.service.js';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    // Register a new user
    //  Register a new user – always creates a plain user (role = "user")
    register = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const { username, email, password } = req.body;
    
            //  Ignore any role sent from client
            const newUser = await this.userService.createUser(
                username,
                email,
                password,
                "user"           //  ← hard-coded role
            );
    
            const { password: _p, ...userWithoutPassword } = newUser;
    
            res.status(201).json(userWithoutPassword);
        }
        catch (error)
        {
            const msg = error instanceof Error ? error.message : "Failed to register user";
    
            if (
                msg.includes("required")      ||
                msg.includes("already in use")||
                msg.includes("must be")       ||
                msg.includes("Invalid")
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
    

    // User login
    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { username, password } = req.body;
            const { user, token } = await this.userService.authenticateUser(username, password);

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            res.json({
                user: userWithoutPassword,
                token
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to login";
            
            if (errorMessage.includes("required")) {
                res.status(400).json({ error: errorMessage });
            } else if (errorMessage.includes("Invalid username or password")) {
                res.status(401).json({ error: "Invalid username or password" });
            } else {
                console.error("Error logging in:", error);
                res.status(500).json({ error: "Failed to login" });
            }
        }
    };

    // Get all users (admin only)
    getUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            res.json( await this.userService.getAllUsers());
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ error: "Failed to fetch users" });
        }
    };

    getPublicUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            res.json( await this.userService.getPublicUsers());
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ error: "Failed to fetch users" });
        }
    };

    // Get user by ID
    getUserById = async (req: Request, res: Response): Promise<void> => {
        try {
            res.json(await this.userService.getUserById(parseInt(req.params.id)));
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
            const { username, email, password, role } = req.body;

            const updatedUser = await this.userService.updateUser(
                parseInt(id),
                username,
                email,
                password,
                role
            );

            // Remove password from response
            const { password: _, ...userWithoutPassword } = updatedUser;
            
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