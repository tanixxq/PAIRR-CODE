import express from "express";
import cors from "cors";
import authRoutes from "./Routes/authRoutes.js";
import roomRoutes from "./Routes/roomRoutes.js";




const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "PAIRCODE API is running 🚀"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);


export default app;