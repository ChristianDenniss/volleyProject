import express, { Application } from 'express';
import { registerModules } from './modules/index.js'; // Keep .js extension for TypeScript

/**
 * Create and configure an Express application
 */
export default function createApp(): Application {
  const app = express();

  // Middleware
  app.use(express.json());  // Middleware to parse JSON request bodies

  // Register all module routes from src/modules/index.ts
  registerModules(app);

  return app;
}
