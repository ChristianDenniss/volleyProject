import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join } from "path";

// Load environment variables
config();

// Force production mode
process.env.NODE_ENV = 'production';

console.log("==========================================");
console.log("MIGRATION PROCESS STARTING");
console.log("==========================================");
console.log("Environment:", process.env.NODE_ENV);
console.log("Node Version:", process.version);
console.log("Current Directory:", process.cwd());
console.log("Database URL:", process.env.DATABASE_URL ? "***URL REDACTED***" : "NOT SET");
console.log("==========================================");

// Initialize the DataSource
const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  entities: [join(__dirname, "..", "**", "*.entity.{js,ts}")],
  migrations: [join(__dirname, "..", "..", "migrations", "*.{js,ts}")],
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