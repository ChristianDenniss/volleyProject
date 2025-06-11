import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Load environment variables
config();

// Force production mode
process.env.NODE_ENV = 'production';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME', 'DB_PORT'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

console.log("==========================================");
console.log("MIGRATION PROCESS STARTING");
console.log("==========================================");
console.log("Environment:", process.env.NODE_ENV);
console.log("Node Version:", process.version);
console.log("Current Directory:", process.cwd());
console.log("Database Host:", process.env.DB_HOST);
console.log("Database Name:", process.env.DB_NAME);
console.log("Database Port:", process.env.DB_PORT);
console.log("==========================================");

// Initialize the DataSource
const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
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