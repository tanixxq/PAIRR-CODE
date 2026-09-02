import Room from "../Models/Room.js";

const generateRoomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars like O/0, I/1
    let code = "";
    for (let i = 0; i < 5; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
};

export const createRoom = async ({ name, userId }) => {
    let roomCode;
    let exists = true;

    // keep generating until we find a code that isn't already taken
    while (exists) {
        roomCode = generateRoomCode();
        exists = await Room.findOne({ roomCode });
    }

    const room = await Room.create({
        roomCode,
        name,
        createdBy: userId,
        members: [userId]
    });

    return room;
};

export const joinRoom = async ({ roomCode, userId }) => {
    const room = await Room.findOne({ roomCode });

    if (!room) {
        throw new Error("Room not found");
    }

    const alreadyMember = room.members.some(
        (memberId) => memberId.toString() === userId
    );

    if (!alreadyMember) {
        room.members.push(userId);
        await room.save();
    }

    return room;
};