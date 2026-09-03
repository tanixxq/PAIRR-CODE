import express from "express";
import { run } from "../Controllers/executeController.js";
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, run);

export default router;