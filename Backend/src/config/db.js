import mongoose from "mongoose";

export const connectDB = async () => {
    console.log("MONGO_URI value:", process.env.MONGO_URI); // 🔍 temporary debug line

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1);
    }
};