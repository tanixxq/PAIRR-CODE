import { executeCode } from "../Services/executeServices.js";

export const run = async (req, res) => {
    try {
        const { language, code } = req.body;

        if (!language || typeof code !== "string") {
            return res.status(400).json({ message: "Language and code are required" });
        }

        const result = await executeCode({ language, code });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message || "Execution failed" });
    }
};