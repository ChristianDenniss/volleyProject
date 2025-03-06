import { Router } from "express";
import pool from "./db/db";

const router = Router();

router.get("/", async(req,res)=>{ res.json({'rsp':'hello'})});

// Test database connection
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

export default router;
