// create-admin-user.js
// Script to create an initial superadmin user.
// Requires ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD env vars — never hardcodes credentials.

import { DataSource } from "typeorm";
import bcrypt from "bcryptjs";
import { getPostgresConnectionOptions } from "./db-config.js";

import { User } from "./src/modules/user/user.entity.js";

const AppDataSource = new DataSource({
    type: "postgres",
    ...getPostgresConnectionOptions(),
    synchronize: false,
    logging: true,
    entities: [User],
});

async function createAdminUser() {
    const username = process.env.ADMIN_USERNAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !email || !password) {
        console.error("FATAL: Set ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD before running this script.");
        process.exit(1);
    }

    if (password.length < 12) {
        console.error("FATAL: ADMIN_PASSWORD must be at least 12 characters.");
        process.exit(1);
    }

    try {
        await AppDataSource.initialize();
        console.log("Database connection established");

        const userRepository = AppDataSource.getRepository(User);

        const existingAdmin = await userRepository.findOne({
            where: { username },
        });

        if (existingAdmin) {
            console.log("Admin user already exists!");
            console.log("Username:", existingAdmin.username);
            console.log("Role:", existingAdmin.role);
            console.log("Email:", existingAdmin.email);
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const adminUser = new User();
        adminUser.username = username;
        adminUser.email = email;
        adminUser.password = hashedPassword;
        adminUser.role = "superadmin";
        adminUser.tokenVersion = 0;

        const savedUser = await userRepository.save(adminUser);

        console.log("✅ Admin user created successfully!");
        console.log("Username:", savedUser.username);
        console.log("Role:", savedUser.role);
        console.log("Email:", savedUser.email);
        console.log("ID:", savedUser.id);
    } catch (error) {
        console.error("Error creating admin user:", error);
        process.exitCode = 1;
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log("Database connection closed");
        }
    }
}

createAdminUser();
