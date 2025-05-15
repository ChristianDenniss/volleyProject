import { Request, Response } from 'express';
import { UserService } from './user.service.js';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    // Register a new user
    register = async (req: Request, res: Response): Promise<void> => {
        try {
            const { username, email, password, role } = req.body;
            const newUser = await this.userService.createUser(username, email, password, role);
            
            // Remove password from response
            const { password: _, ...userWithoutPassword } = newUser;
            
            res.status(201).json(userWithoutPassword);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to register user";
            
            if (errorMessage.includes("required") || 
                errorMessage.includes("already in use") || 
                errorMessage.includes("must be") ||
                errorMessage.includes("Invalid")) {
                res.status(400).json({ error: errorMessage });
            } else {
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
            const users = await this.userService.getAllUsers();
            
            // Remove passwords from response
            const usersWithoutPasswords = users.map(user => {
                const { password, ...userWithoutPassword } = user;
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
            const { password, ...userWithoutPassword } = user;
            
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
    getProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            // The user ID should be added to the request by authentication middleware
            const userId = (req as any).userId;
            
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            
            const user = await this.userService.getProfile(userId);
            
            // Remove password from response
            const { password, ...userWithoutPassword } = user;
            
            res.json(userWithoutPassword);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch profile";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching user profile:", error);
                res.status(500).json({ error: "Failed to fetch profile" });
            }
        }
    };
}