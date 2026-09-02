import express from "express";
import { register,login } from "../Controllers/authController.js";
import {protect} from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.get("/login", login);
router.get("/me", protect, (req, res) => {
    res.status(200).json({ message: "You are authenticated", userId: req.userId });
});

export default router;