import { registerUser, loginUser } from "../Services/AuthServices.js";

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