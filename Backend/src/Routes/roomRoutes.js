import express from "express";
import { create, join } from "../Controllers/roomController.js";
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, create);
router.post("/join", protect, join);

export default router;