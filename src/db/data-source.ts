import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { join } from "path";

dotenv.config();

// List your entity imports manually
import { Games } from "./entities/Games";
import { Players } from "./entities/Players";
import { Seasons } from "./entities/Seasons";
import { Stats } from "./entities/Stats";
import { Teams } from "./entities/Teams";
import { User } from "./entities/User";

// Define entities for development (using TypeScript)
const entities = [
    Games,
    Players,
    Stats,
    Teams,
    Seasons,
    User,
    // Add all other entity classes here
];

// Define migration paths for development
const migrations = [join(__dirname, "db/migrations", "*.ts")];

// Configure AppDataSource
export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize: false, // Use migrations instead
    logging: true,
    entities: process.env.NODE_ENV === 'production'
        ? [join(__dirname, 'dist/db/entities/*.js')] // Use compiled JS files in production
        : entities, // Use TS files for development
    migrations: process.env.NODE_ENV === 'production'
        ? [join(__dirname, 'dist/db/migrations/*.js')] // Use compiled JS files in production
        : migrations, // Use TS migrations for development
    subscribers: [],
});
