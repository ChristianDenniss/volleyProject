import { Request, Response } from "express";
import { AppDataSource } from "../data-source"; // TypeORM DataSource
import { User } from "../entities/User";

// Create User
export const createUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { name, email } = req.body;

        const userRepository = AppDataSource.getRepository(User);

        const newUser = new User();
        newUser.name = name;
        newUser.email = email;

        const savedUser = await userRepository.save(newUser);
        return res.status(201).json(savedUser); // Return the newly created user
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).send("Failed to create user");
    }
};

// Get Users
export const getUsers = async (req: Request, res: Response): Promise<Response> => {
    try {
        const userRepository = AppDataSource.getRepository(User);
        const users = await userRepository.find();
        return res.json(users); // Return all users
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).send("Failed to fetch users");
    }
};

// Get User by ID
export const getUserById = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: parseInt(id) } });

        if (!user) {
            return res.status(404).send("User not found");
        }

        return res.json(user); // Return the user found
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).send("Failed to fetch user");
    }
};

// Update User by ID
export const updateUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        const userRepository = AppDataSource.getRepository(User);
        let user = await userRepository.findOne({ where: { id: parseInt(id) } });

        if (!user) {
            return res.status(404).send("User not found");
        }

        user.name = name || user.name;
        user.email = email || user.email;

        const updatedUser = await userRepository.save(user);
        return res.json(updatedUser); // Return the updated user
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).send("Failed to update user");
    }
};

// Delete User by ID
export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: parseInt(id) } });

        if (!user) {
            return res.status(404).send("User not found");
        }

        await userRepository.remove(user);
        return res.status(204).send(); // Return no content after deletion
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).send("Failed to delete user");
    }
};
