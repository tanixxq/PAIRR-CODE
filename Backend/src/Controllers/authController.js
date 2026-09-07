import { registerUser, loginUser,updateUsername } from "../Services/AuthServices.js";

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await registerUser({ username, email, password });

        res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const result = await loginUser({ email, password });

        res.status(200).json({ message: "Login successful", ...result });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

export const changeUsername = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || !username.trim()) {
            return res
                .status(400)
                .json({ message: "Username is required" });
        }

        const user = await updateUsername({
            userId: req.userId,
            username
        });

        res.status(200).json({
            message: "Username updated successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};