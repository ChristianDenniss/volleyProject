import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get the current file's directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Entities from modules
import { Teams } from "../modules/teams/team.entity.js";
import { Players } from "../modules/players/player.entity.js";
import { Games } from "../modules/games/game.entity.js";
import { Seasons } from "../modules/seasons/season.entity.js";
import { Stats } from "../modules/stats/stat.entity.js";
import { User } from "../modules/user/user.entity.js";
import { RoleAuditLog } from "../modules/user/role-audit-log.entity.js";
import { Article } from "../modules/articles/article.entity.js";
import { Awards } from "../modules/awards/award.entity.js";
import { Records } from "../modules/records/records.entity.js";
import { Application } from "../modules/applications/application.entity.js";
import { Region } from "../modules/regions/region.entity.js";

dotenv.config();

// Define entities
const entities = [
    Teams,
    Players,
    Games,
    Seasons,
    Stats,
    User,
    RoleAuditLog,
    Article,
    Awards,
    Records,
    Application,
    Region
];

// Configure AppDataSource
export const AppDataSource = new DataSource({
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
    logging: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn", "migration"],
    maxQueryExecutionTime: 1000,
    entities: entities,
    migrations: [join(__dirname, "..", "..", "migrations", "*.{js,ts}")], // Point to dist/migrations in production
    migrationsTableName: "migrations", // Explicitly set migrations table name
    subscribers: [],
    ssl: false, // Disable SSL by default, let the connection URL handle SSL settings
});

// Initialize the DataSource
export async function initializeDataSource(): Promise<DataSource> {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("Database connection established");
            console.log("TypeORM logging enabled for: error, warn, query, schema, migration, info");
        }
        return AppDataSource;
    } catch (error) {
        console.error("Error initializing database connection:", error);
        throw error;
    }
}