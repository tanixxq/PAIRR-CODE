import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
    {
        roomCode: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            trim: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;