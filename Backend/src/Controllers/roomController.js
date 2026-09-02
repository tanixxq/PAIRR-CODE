import { createRoom, joinRoom } from "../Services/roomServices.js";

export const create = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.userId;

        const room = await createRoom({ name, userId });

        res.status(201).json({ message: "Room created", room });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const join = async (req, res) => {
    try {
        const { roomCode } = req.body;
        const userId = req.userId;

        if (!roomCode) {
            return res.status(400).json({ message: "Room code is required" });
        }

        const room = await joinRoom({ roomCode, userId });

        res.status(200).json({ message: "Joined room", room });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};