import { executeCode } from "../Services/executeServices.js";

export const run = async (req, res) => {
    try {
        const { language, code, input } = req.body;

        if (!language || typeof code !== "string") {
            return res.status(400).json({ message: "Language and code are required" });
        }

        const result = await executeCode({ language, code, input });

        res.status(200).json(result);
    } catch (error) {
        console.error("EXECUTE ERROR:", error.response?.data || error.message);
        res.status(500).json({ message: error.message || "Execution failed" });
    }
};