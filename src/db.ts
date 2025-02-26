import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connection success");
  } catch (err) {
    console.error("❌ Failed to connect to database:", err);
    process.exit(1);
  }
}

export { client };
