import { DataSource } from 'typeorm';
import { AppDataSource } from '../db/data-source.js';

async function runMigrations() {
    try {
        const dataSource = await AppDataSource.initialize();
        console.log('Running migrations...');
        
        // This will automatically skip migrations that have already been applied
        await dataSource.runMigrations();
        
        console.log('Migrations completed successfully');
        await dataSource.destroy();
    } catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1);
    }
}

runMigrations(); 