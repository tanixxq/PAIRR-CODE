import dotenv from "dotenv";
import app from "./src/App.js";
import { connectDB } from "./src/config/db.js";

dotenv.config();   // 1. load .env into process.env FIRST

connectDB();        // 2. now MONGO_URI actually exists

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`PAIRCODE server running on port ${PORT}`);
});