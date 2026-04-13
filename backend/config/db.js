import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGO_URI);

let conn;

try {
  conn = await client.connect();
  console.log("MongoDB connected successfully");
} catch (err) {
  console.error("MongoDB connection error:", err);
  process.exit(1);
}

export default conn;