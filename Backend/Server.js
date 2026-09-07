import dotenv from "dotenv";

dotenv.config();

import http from "http";
import { Server } from "socket.io";
import app from "./src/App.js";
import { connectDB } from "./src/config/db.js";
import jwt from "jsonwebtoken";
import Room from "./src/Models/Room.js";

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// =========================
// SOCKET AUTHENTICATION
// =========================

io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Not authorized, no token"));
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        socket.data.userId = decoded.id;

        next();
    } catch (error) {
        next(new Error("Not authorized, invalid token"));
    }
});

const roomMembers = new Map();
// roomCode -> Set of socket IDs

const roomState = new Map();
// roomCode -> { code, language }

const getRoomList = (roomCode) =>
    Array.from(roomMembers.get(roomCode) || []).map(
        (socketId) => {
            const memberSocket =
                io.sockets.sockets.get(socketId);

            return {
                socketId,
                userId: memberSocket?.data.userId,
                isOwner: memberSocket?.data.isOwner
            };
        }
    );

io.on("connection", (socket) => {

    console.log(
        `🔌 New client connected: ${socket.id}`
    );

    // =========================
    // JOIN ROOM
    // =========================

    socket.on("join-room", async (roomCode) => {

        const room = await Room.findOne({ roomCode });

        if (!room) {
            return;
        }

        // User must be a member of the room
        const isMember = room.members.some(
            (memberId) =>
                memberId.toString() === socket.data.userId
        );

        if (!isMember) {
            console.log(
                `🚫 Unauthorized room join attempt: ${socket.data.userId}`
            );

            socket.emit("room-access-denied");

            return;
        }

        socket.data.isOwner =
            room.createdBy.toString() === socket.data.userId;

        socket.join(roomCode);

        socket.data.roomCode = roomCode;

        if (!roomMembers.has(roomCode)) {
            roomMembers.set(roomCode, new Set());
        }

        roomMembers.get(roomCode).add(socket.id);

        io.to(roomCode).emit(
            "room-users",
            getRoomList(roomCode)
        );

        // Catch this new joiner up on
        // the room's current code + language

        const state = roomState.get(roomCode);

        if (state) {
            socket.emit("init-state", state);
        }
    });

    // =========================
    // REMOVE MEMBER
    // =========================

    socket.on(
        "remove-member",
        async ({ roomCode, targetSocketId }) => {

            const room = await Room.findOne({ roomCode });

            if (!room) {
                return;
            }

            // Only the room owner can remove members
            if (
                room.createdBy.toString() !==
                socket.data.userId
            ) {
                return;
            }

            // Owner cannot remove themselves
            if (targetSocketId === socket.id) {
                return;
            }

            const targetSocket =
                io.sockets.sockets.get(targetSocketId);

            if (!targetSocket) {
                return;
            }

            // Make sure target is actually in this room
            if (
                targetSocket.data.roomCode !==
                roomCode
            ) {
                return;
            }

            // Remove target user from the database
            room.members = room.members.filter(
                (memberId) =>
                    memberId.toString() !==
                    targetSocket.data.userId
            );

            await room.save();

            // Remove target from Socket.IO room
            targetSocket.leave(roomCode);

            targetSocket.data.roomCode = null;

            // Remove target from our in-memory member list
            if (roomMembers.has(roomCode)) {

                roomMembers
                    .get(roomCode)
                    .delete(targetSocketId);

            }

            // Tell removed user
            targetSocket.emit("member-removed");

            // Forcefully disconnect their socket
            setTimeout(() => {
                targetSocket.disconnect(true);
            }, 100);

            // Update everyone still inside the room
            io.to(roomCode).emit(
                "room-users",
                getRoomList(roomCode)
            );
        }
    );

    // =========================
    // CODE CHANGE
    // =========================

    socket.on(
        "code-change",
        ({ roomCode, code }) => {

            const state =
                roomState.get(roomCode) || {
                    code: "",
                    language: "javascript"
                };

            state.code = code;

            roomState.set(
                roomCode,
                state
            );

            socket
                .to(roomCode)
                .emit(
                    "code-change",
                    code
                );
        }
    );

    // =========================
    // LANGUAGE CHANGE
    // =========================

    socket.on(
        "language-change",
        ({ roomCode, language }) => {

            const state =
                roomState.get(roomCode) || {
                    code: "",
                    language: "javascript"
                };

            state.language = language;

            roomState.set(
                roomCode,
                state
            );

            socket
                .to(roomCode)
                .emit(
                    "language-change",
                    language
                );
        }
    );

    // =========================
    // TYPING PRESENCE
    // =========================

    socket.on(
        "typing-start",
        (roomCode) => {

            socket
                .to(roomCode)
                .emit(
                    "typing-start",
                    socket.id
                );
        }
    );

    socket.on(
        "typing-stop",
        (roomCode) => {

            socket
                .to(roomCode)
                .emit(
                    "typing-stop",
                    socket.id
                );
        }
    );

    // =========================
    // DISCONNECT
    // =========================

    socket.on("disconnecting", () => {

        console.log(
            `⚠️ Client disconnecting: ${socket.id}`
        );

        const roomCode =
            socket.data.roomCode;

        if (
            roomCode &&
            roomMembers.has(roomCode)
        ) {

            roomMembers
                .get(roomCode)
                .delete(socket.id);

            if (
                roomMembers
                    .get(roomCode)
                    .size === 0
            ) {

                roomMembers.delete(roomCode);

                roomState.delete(roomCode);

            } else {

                socket
                    .to(roomCode)
                    .emit(
                        "room-users",
                        getRoomList(roomCode)
                    );

                // Make sure other users don't keep
                // showing this disconnected user as typing

                socket
                    .to(roomCode)
                    .emit(
                        "typing-stop",
                        socket.id
                    );
            }
        }
    });

    socket.on("disconnect", () => {

        console.log(
            `❌ Client disconnected: ${socket.id}`
        );
    });
});

const PORT =
    process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log(
        `PAIRCODE server running on port ${PORT}`
    );
});