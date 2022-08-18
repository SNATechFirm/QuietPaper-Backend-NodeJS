import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema({
    isActive: { type: Boolean, default: true },
    libId: { type: mongoose.Schema.Types.ObjectId, ref: "library" },
    userIds: { type: [{ type: mongoose.Schema.Types.ObjectId, default: null }], default: [] },
}, { timestamps: true })

export const roomModel = mongoose.model('room', roomSchema)