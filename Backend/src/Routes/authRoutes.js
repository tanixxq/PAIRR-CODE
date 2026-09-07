import express from "express";
import { register,login,changeUsername } from "../Controllers/authController.js";
import {protect} from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.patch("/username", protect, changeUsername);
router.get("/me", protect, (req, res) => {
    res.status(200).json({ message: "You are authenticated", userId: req.userId });
});


export default router;