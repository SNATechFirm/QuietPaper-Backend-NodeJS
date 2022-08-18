import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
    isActive: { type: Boolean, default: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, default: null },
    roomId: { type: mongoose.Schema.Types.ObjectId, default: null },
    message: { type: String, default: null },
}, { timestamps: true })

export const messageModel = mongoose.model('message', messageSchema)