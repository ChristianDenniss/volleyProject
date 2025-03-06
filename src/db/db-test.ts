import pool from '../db/db';  // Adjust path if necessary

async function testDbConnection() {
  try {
    const res = await pool.query('SELECT NOW()');  // This just checks the connection
    console.log('Database connection successful:', res.rows);
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
}

testDbConnection();
