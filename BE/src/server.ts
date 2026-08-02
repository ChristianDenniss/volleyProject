import 'reflect-metadata';
import { createServer } from 'http';
import { createTerminus } from '@godaddy/terminus';
import { env } from './config/env.js';
import createApp from './app.js';
import { AppDataSource, initializeDataSource } from './db/data-source.js';
import { seedDevData } from './db/seed-dev.js';
import { errorHandler } from './middleware/errorHandling.js'; // Import error handler

const INSECURE_JWT_SECRETS = new Set([
  'your-super-secret-jwt-key-change-this-in-production',
  'replace-with-a-secure-random-secret',
]);

const jwtSecret = env.JWT_SECRET?.trim();
const hasInsecureJwtSecret = !jwtSecret || INSECURE_JWT_SECRETS.has(jwtSecret);

if (env.NODE_ENV === 'production' && hasInsecureJwtSecret) {
  console.error('FATAL: JWT_SECRET environment variable is not set to a secure value.');
  process.exit(1);
}

if (hasInsecureJwtSecret) {
  console.warn('WARNING: JWT_SECRET is using a placeholder value. OK for local development only.');
}

const PORT = env.PORT;

console.log(
  `Starting server (${env.NODE_ENV}) on port ${PORT}` +
    (env.DATABASE_URL ? ' with DATABASE_URL' : ' without DATABASE_URL')
);

async function startServer(): Promise<void> {
  try {
    // Initialize TypeORM DataSource
    await initializeDataSource();

    if (env.NODE_ENV === 'development') {
      await seedDevData();
    }

    const app = createApp();

    // Register global error handler LAST
    app.use(errorHandler); // Add this line to register the error handler

    const server = createServer(app);

    // Handle server graceful shutdown + liveness/readiness probes
    createTerminus(server, {
      signal: 'SIGTERM',
      healthChecks: {
        '/health': async () => {
          if (!AppDataSource.isInitialized) {
            throw new Error('Database not initialized');
          }
          await AppDataSource.query('SELECT 1');
          return { status: 'ok' };
        },
      },
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
