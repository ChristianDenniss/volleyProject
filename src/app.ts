import express, { Application } from 'express';
import { registerModules } from './modules/index.js'; // Keep .js extension for TypeScript
import { globalMiddleware } from './middleware/globalMiddleware.js';

/**
 * Create and configure an Express application
 */
export default function createApp(): Application 
{
  const app = express();

  // Register global middleware
  globalMiddleware(app);  

  // Register all module routes from src/modules/index.ts
  registerModules(app);

  return app;
}
