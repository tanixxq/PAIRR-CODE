import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import app from "./src/App.js";
import { connectDB } from "./src/config/db.js";

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const roomMembers = new Map(); // roomCode -> Set of socket IDs
const roomState = new Map();   // roomCode -> { code, language }

const getRoomList = (roomCode) => Array.from(roomMembers.get(roomCode) || []);

io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    socket.on("join-room", (roomCode) => {
        socket.join(roomCode);
        socket.data.roomCode = roomCode;

        if (!roomMembers.has(roomCode)) {
            roomMembers.set(roomCode, new Set());
        }
        roomMembers.get(roomCode).add(socket.id);

        io.to(roomCode).emit("room-users", getRoomList(roomCode));

        // catch this new joiner up on the room's current code + language
        const state = roomState.get(roomCode);
        if (state) {
            socket.emit("init-state", state);
        }
    });

    socket.on("code-change", ({ roomCode, code }) => {
        const state = roomState.get(roomCode) || { code: "", language: "javascript" };
        state.code = code;
        roomState.set(roomCode, state);

        socket.to(roomCode).emit("code-change", code);
    });

    socket.on("language-change", ({ roomCode, language }) => {
        const state = roomState.get(roomCode) || { code: "", language: "javascript" };
        state.language = language;
        roomState.set(roomCode, state);

        socket.to(roomCode).emit("language-change", language);
    });

    socket.on("disconnecting", () => {
        console.log(`⚠️ Client disconnecting: ${socket.id}`);

        const roomCode = socket.data.roomCode;
        if (roomCode && roomMembers.has(roomCode)) {
            roomMembers.get(roomCode).delete(socket.id);

            if (roomMembers.get(roomCode).size === 0) {
                roomMembers.delete(roomCode);
                roomState.delete(roomCode); // clean up empty rooms fully
            } else {
                socket.to(roomCode).emit("room-users", getRoomList(roomCode));
            }
        }
    });

    socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`PAIRCODE server running on port ${PORT}`);
});