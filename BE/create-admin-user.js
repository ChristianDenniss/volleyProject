// create-admin-user.js
// Script to create an initial admin user

import { DataSource } from "typeorm";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get the current file's directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Import the User entity
import { User } from "./src/modules/user/user.entity.js";

// Configure DataSource
const AppDataSource = new DataSource({
    type: "postgres",
    ...(process.env.DATABASE_URL 
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST || "localhost",
            port: Number(process.env.DB_PORT) || 5432,
            username: process.env.DB_USER || "postgres",
            password: process.env.DB_PASS || "password",
            database: process.env.DB_NAME || "volleyball",
        }
    ),
    synchronize: false,
    logging: true,
    entities: [User],
    ssl: false,
});

async function createAdminUser() {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        console.log("Database connection established");

        const userRepository = AppDataSource.getRepository(User);

        // Check if admin user already exists
        const existingAdmin = await userRepository.findOne({
            where: { username: "admin" }
        });

        if (existingAdmin) {
            console.log("Admin user already exists!");
            console.log("Username:", existingAdmin.username);
            console.log("Role:", existingAdmin.role);
            console.log("Email:", existingAdmin.email);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash("admin123", 10);

        // Create admin user
        const adminUser = new User();
        adminUser.username = "admin";
        adminUser.email = "admin@volleyball.com";
        adminUser.password = hashedPassword;
        adminUser.role = "superadmin";

        const savedUser = await userRepository.save(adminUser);

        console.log("✅ Admin user created successfully!");
        console.log("Username: admin");
        console.log("Password: admin123");
        console.log("Role: superadmin");
        console.log("Email: admin@volleyball.com");
        console.log("ID:", savedUser.id);

        console.log("\n🔐 You can now:");
        console.log("1. Login via the web app with username: 'admin', password: 'admin123'");
        console.log("2. Use JWT tokens for API access");
        console.log("3. Use your API key for direct access");

    } catch (error) {
        console.error("Error creating admin user:", error);
    } finally {
        await AppDataSource.destroy();
        console.log("Database connection closed");
    }
}

// Run the script
createAdminUser(); 