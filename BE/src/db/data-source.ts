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

// Define migration paths
const migrations = [join(__dirname, "migrations", "*.js")]; 

// Configure AppDataSource
export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || "postgres",
    database: process.env.DB_NAME || "volleyball",
    url: process.env.URL,
    synchronize: process.env.NODE_ENV === 'development', // Only sync in development
    logging: process.env.NODE_ENV === 'development',
    entities: process.env.NODE_ENV === 'production'
        ? ["dist/modules/*/*.entity.js"] // Use compiled JS files in production
        : entities, // Use entity objects for development
    migrations: process.env.NODE_ENV === 'production'
        ? ["dist/db/migrations/*.js"] // Use compiled JS files in production
        : migrations, // Use TS migrations for development
    subscribers: [],
});