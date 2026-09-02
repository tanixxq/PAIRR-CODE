import express from "express";
import cors from "cors";
import testroutes from "./Routes/TestRoutes.js";



const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "PAIRCODE API is running 🚀"
    });
});

app.use("/api", testroutes);

export default app;