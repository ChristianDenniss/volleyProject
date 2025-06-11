import 'reflect-metadata';
import { createServer } from 'http';
import { createTerminus } from '@godaddy/terminus';
import dotenv from 'dotenv';
import createApp from './app.js';
import { AppDataSource, initializeDataSource } from './db/data-source.js';
import { errorHandler } from './middleware/errorHandling.js'; // Import error handler

dotenv.config();
const PORT = process.env.PORT || 5000;

// Force production mode
process.env.NODE_ENV = 'production';

console.log("==========================================");
console.log("SERVER STARTING");
console.log("==========================================");
console.log("Environment:", process.env.NODE_ENV);
console.log("Node Version:", process.version);
console.log("Current Directory:", process.cwd());
console.log("Database URL:", process.env.DATABASE_URL ? "***URL REDACTED***" : "NOT SET");
console.log("==========================================");

async function startServer(): Promise<void> {
  try {
    // Initialize TypeORM DataSource
    await initializeDataSource();

    const app = createApp();

    // Register global error handler LAST
    app.use(errorHandler); // Add this line to register the error handler

    const server = createServer(app);

    // Handle server graceful shutdown
    createTerminus(server, {
      signal: 'SIGTERM',
      onSignal: async () => {
        // Cleanup logic before shutdown
        console.log('Server is shutting down');
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          console.log('Database connections closed');
        }
      }
    });

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log("==========================================");
    });
  } catch (error) {
    console.error('Error during startup:', error);
    process.exit(1);
  }
}

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});

export {}; // Add empty export to ensure this is treated as an ESM module
