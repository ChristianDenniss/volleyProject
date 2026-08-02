import { DataSource } from "typeorm";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { env, getPostgresConnectionOptions } from "../config/env.js";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("==========================================");
console.log("MIGRATION PROCESS STARTING");
console.log("==========================================");
console.log("Environment:", env.NODE_ENV);
console.log("Node Version:", process.version);
console.log("Current Directory:", process.cwd());

if (env.DATABASE_URL) {
    console.log("Using DATABASE_URL (redacted)");
} else {
    console.log("Using individual DB parameters:");
    console.log("Database Host:", env.DB_HOST);
    console.log("Database Name:", env.DB_NAME);
    console.log("Database Port:", env.DB_PORT);
}
console.log("==========================================");

// Initialize the DataSource
const AppDataSource = new DataSource({
    type: "postgres",
    ...getPostgresConnectionOptions(env),
    entities: [join(__dirname, "..", "modules", "**", "*.entity.{js,ts}")],
    migrations: [join(__dirname, "*.{js,ts}")],
    migrationsTransactionMode: "each",
    synchronize: false,
    logging: true,
});

console.log("Initializing database connection...");

// Run migrations
AppDataSource.initialize()
    .then(async () => {
        console.log("Database connection established");
        console.log("Running migrations...");
        
        try {
            const migrations = await AppDataSource.runMigrations();
            console.log("Migrations completed successfully");
            console.log("Executed migrations:", migrations.map(m => m.name));
        } catch (error) {
            console.error("Error running migrations:", error);
            process.exit(1);
        } finally {
            console.log("Closing database connection...");
            await AppDataSource.destroy();
            console.log("Database connection closed");
            console.log("==========================================");
        }
    })
    .catch((error) => {
        console.error("Error during Data Source initialization:", error);
        process.exit(1);
    });
