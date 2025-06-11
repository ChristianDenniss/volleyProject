import { AppDataSource, initializeDataSource } from '../db/data-source.js';

async function runMigrations() {
    let dataSource = null;
    
    try {
        console.log("Initializing database connection...");
        dataSource = await initializeDataSource();
        console.log("Database connection established");

        console.log("Running migrations...");
        const migrations = await dataSource.runMigrations();
        console.log("Migrations completed successfully");
        
        if (migrations.length > 0) {
            console.log("Applied migrations:");
            migrations.forEach(migration => {
                console.log(`- ${migration.name}`);
            });
        } else {
            console.log("No new migrations to apply");
        }
    } catch (error) {
        console.error("Error during migration:", error);
        process.exit(1);
    } finally {
        if (dataSource?.isInitialized) {
            console.log("Closing database connection...");
            await dataSource.destroy();
            console.log("Database connection closed");
        }
    }
}

// Run migrations
runMigrations(); 