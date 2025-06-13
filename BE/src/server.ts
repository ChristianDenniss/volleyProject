import 'reflect-metadata';
import { createServer } from 'http';
import { createTerminus } from '@godaddy/terminus';
import dotenv from 'dotenv';

import createApp from './app.ts';
import { AppDataSource, initializeDataSource } from './db/data-source.ts';
import { errorHandler } from './middleware/errorHandling.ts'; // Import error handler

// Load environment variables
dotenv.config();

// Force production mode
process.env.NODE_ENV = 'production';

const PORT = process.env.PORT || 3000; // Default to 3000 to match docker-compose

console.log("==========================================");
console.log("SERVER STARTING");
console.log("==========================================");
console.log("Environment:", process.env.NODE_ENV);
console.log("Node Version:", process.version);
console.log("Current Directory:", process.cwd());
console.log("Database URL:", process.env.DATABASE_URL ? "***URL REDACTED***" : "NOT SET");
console.log("Port:", PORT);
console.log("==========================================");

async function startServer(): Promise<void> {
  try {
    // Initialize TypeORM DataSource
    await initializeDataSource();
    console.log("Database connection established");

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
