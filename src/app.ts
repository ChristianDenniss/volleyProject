import express, { Application } from 'express';
import { registerModules } from './modules';

export default function createApp(): Application {
  const app = express();
  
  // Middleware
  app.use(express.json());
  
  // Register all module routes
  registerModules(app);
  
  return app;
}