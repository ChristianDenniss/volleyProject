import express from "express";
import router from "./routes";
import dotenv from "dotenv";
import { AppDataSource } from "./db/data-source";  // Import your AppDataSource

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize TypeORM DataSource
async function startApp() {
  try {
    await AppDataSource.initialize();  // Initialize TypeORM connection
    console.log("Database connection established");

    app.use(express.json());
    app.use(router);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error during Data Source initialization:", error);
    process.exit(1);  // Stop the app if the database connection fails
  }
}

startApp();