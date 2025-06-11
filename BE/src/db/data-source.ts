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
import { Article } from "../modules/articles/article.entity.js";
import { Awards } from "../modules/awards/award.entity.js";

dotenv.config();

// Define entities
const entities = [
    Teams,
    Players,
    Games,
    Seasons,
    Stats,
    User,
    Article,
    Awards
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
    synchronize: false, // Disable synchronize to prevent automatic schema updates
    logging: process.env.NODE_ENV !== 'production',
    entities: entities,
    migrations: [join(__dirname, "..", "migrations", "*.{js,ts}")], // Point to src/migrations
    migrationsTableName: "migrations", // Explicitly set migrations table name
    subscribers: [],
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Initialize the DataSource
export async function initializeDataSource(): Promise<DataSource> {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("Database connection established");
        }
        return AppDataSource;
    } catch (error) {
        console.error("Error initializing database connection:", error);
        throw error;
    }
}