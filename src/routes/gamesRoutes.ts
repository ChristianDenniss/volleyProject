import { Router } from "express";
import {
    createGame,
    getGames,
    getGameById,
    updateGame,
    deleteGame,
    addStatsToGame
} from "../db/CRUD/gamesController";  // Adjust the path if needed

const router = Router();

// Route to create a new game
router.post("/games", createGame);

// Route to get all games
router.get("/games", getGames);

// Route to get a game by its ID
router.get("/games/:id", getGameById);

// Route to update a game by its ID
router.put("/games/:id", updateGame);

// Route to delete a game by its ID
router.delete("/games/:id", deleteGame);

// Route to add stats to an existing game
router.post("/games/:id/stats", addStatsToGame);  // Assuming stats are added via POST request

export default router;
