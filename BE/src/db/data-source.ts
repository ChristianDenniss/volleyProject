import "reflect-metadata";
import { DataSource } from "typeorm";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { env, getPostgresConnectionOptions } from "../config/env.js";

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
    ...getPostgresConnectionOptions(env),
    // Never auto-sync from NODE_ENV — opt in explicitly for throwaway local DBs only.
    // Schema changes ship via migrations (see src/migrations).
    synchronize: env.TYPEORM_SYNCHRONIZE === "true",
    logging: env.NODE_ENV === "production" ? ["error"] : ["error", "warn", "migration"],
    maxQueryExecutionTime: 1000,
    entities: entities,
    migrations: [join(__dirname, "..", "migrations", "*.{js,ts}")], // src/migrations (or dist/migrations after build)
    migrationsTableName: "migrations", // Explicitly set migrations table name
    migrationsTransactionMode: "each",
    subscribers: [],
});

// Initialize the DataSource
export async function initializeDataSource(): Promise<DataSource> {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("Database connection established");
            const logging = AppDataSource.options.logging;
            console.log(
              "TypeORM logging enabled for:",
              Array.isArray(logging) ? logging.join(", ") : String(logging)
            );
        }
        return AppDataSource;
    } catch (error) {
        console.error("Error initializing database connection:", error);
        throw error;
    }
}
