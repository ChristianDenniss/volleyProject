import { Router } from "express";
import { AppDataSource } from "../db/data-source"; // Import TypeORM DataSource
import { User } from "../db/entities/User"; // Import your User entity

const router = Router();

router.get("/", async (req, res) =>
{
    res.json({ rsp: "hello" });
});

// Test database connection with TypeORM
router.get("/users", async (req, res) =>
{
    try
    {
        const userRepository = AppDataSource.getRepository(User); // Get User repository
        const users = await userRepository.find(); // Fetch all users
        res.json(users);
    }
    catch (err)
    {
        console.error("Database error:", err);
        res.status(500).send("Failed to fetch users");
    }
});

export default router;
