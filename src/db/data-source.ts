import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize: false, // Use migrations instead
    logging: true,
    entities: [
        process.env.NODE_ENV === 'production' 
            ? 'dist/db/entities/*.js' 
            : 'src/db/entities/*.ts'
    ],
    migrations: [
        process.env.NODE_ENV === 'production' 
            ? 'dist/db/migrations/*.js' 
            : 'src/db/migrations/*.ts'
    ],
});
