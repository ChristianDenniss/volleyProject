import 'reflect-metadata';
import { createServer } from 'http';
import { createTerminus } from '@godaddy/terminus';
import dotenv from 'dotenv';
import createApp from './app.ts';
import { AppDataSource } from './db/data-source.ts';
import { errorHandler } from './middleware/errorHandling.ts'; // Import error handler
dotenv.config();
const PORT = process.env.PORT || 5000;

async function startServer(): Promise<void> {
  try {
    // Initialize TypeORM DataSource
    await AppDataSource.initialize();
    console.log('Database connection established');

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
        await AppDataSource.destroy();
        console.log('Database connections closed');
      }
    });

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error during startup:', error);
    process.exit(1);
  }
}

startServer().catch((error) => console.error('Server startup failed:', error));

export {}; // Add empty export to ensure this is treated as an ESM module
