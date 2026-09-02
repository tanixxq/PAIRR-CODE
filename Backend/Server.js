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

io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    socket.on("join-room", (roomCode) => {
        socket.join(roomCode);
        console.log(`👤 ${socket.id} joined room ${roomCode}`);

        socket.to(roomCode).emit("user-joined", { socketId: socket.id });
    });

    socket.on("disconnecting", () => {
        console.log(`⚠️ Client disconnecting: ${socket.id}`);

        socket.rooms.forEach((roomCode) => {
            if (roomCode !== socket.id) {
                socket.to(roomCode).emit("user-left", { socketId: socket.id });
            }
        });
    });

    socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`PAIRCODE server running on port ${PORT}`);
});