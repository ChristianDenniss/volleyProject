// reset-user-roles.js
// Seed script to reset all admin/superadmin users back to plain user role
// and invalidate their existing JWTs by bumping tokenVersion.

import { existsSync } from "fs";
import { DataSource, In } from "typeorm";
import { getPostgresConnectionOptions } from "./db-config.js";

const userEntityPath = existsSync("./dist/modules/user/user.entity.js")
    ? "./dist/modules/user/user.entity.js"
    : "./src/modules/user/user.entity.js";

const { User } = await import(userEntityPath);

const AppDataSource = new DataSource({
    type: "postgres",
    ...getPostgresConnectionOptions(),
    synchronize: false,
    logging: false,
    entities: [User],
});

const ELEVATED_ROLES = ["admin", "superadmin"];

async function resetUserRoles() {
    try {
        await AppDataSource.initialize();
        console.log("Database connection established");

        const userRepository = AppDataSource.getRepository(User);

        const elevatedUsers = await userRepository.find({
            where: { role: In(ELEVATED_ROLES) },
            select: ["id", "username", "email", "role"],
            order: { id: "ASC" },
        });

        if (elevatedUsers.length === 0) {
            console.log("No admin or superadmin users found. Nothing to update.");
            return;
        }

        console.log(`Found ${elevatedUsers.length} user(s) to reset:`);
        for (const user of elevatedUsers) {
            console.log(`  - id=${user.id} username=${user.username} role=${user.role}`);
        }

        for (const user of elevatedUsers) {
            await userRepository.update(user.id, { role: "user" });
            await userRepository.increment({ id: user.id }, "tokenVersion", 1);
        }

        console.log(`\n✅ Reset ${elevatedUsers.length} user(s) to role: user`);
        console.log("Existing JWTs for those users are now invalid.");
    } catch (error) {
        console.error("Error resetting user roles:", error);
        process.exitCode = 1;
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log("Database connection closed");
        }
    }
}

resetUserRoles();
