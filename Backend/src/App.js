import express from "express";
import cors from "cors";
import authRoutes from "./Routes/authRoutes.js";
import roomRoutes from "./Routes/roomRoutes.js";
import executeRoutes from "./Routes/executeRoutes.js";


const app = express();

const allowedOrigin =
    process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({
    origin: allowedOrigin
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "PAIRCODE API is running 🚀"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/execute", executeRoutes);


export default app;