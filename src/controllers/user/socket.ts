import mongoose from "mongoose";
import { studentModel } from "../../database";
import { messageModel } from "../../database/models/message";
import { roomModel } from "../../database/models/room";

import * as ioController from "../../io"
const io = ioController.getIo();
const ObjectId: any = mongoose.Types.ObjectId;

io.on('connection', (socket) => {
    console.log(`New user arrived!`, socket.id);

    socket.on("newBookingDone", async (data) => {
        socket.broadcast.emit("recieved booking please refresh page of seat information", data)
    })
    socket.on('join_room', async (data) => {
        console.log('join_room', data);
        //check if user is banned or not from room
        const student = await studentModel.findOne({ _id: ObjectId(data.userId) }, { isBaneFromChat: true })
        if (student) {
            return socket.emit("banned from groupChat", student);
        }
        //push the joinedUser into room after checking he is connected or not.
        //one condition is pending to check user is connected or not.`````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````
        await roomModel.updateOne({ _id: ObjectId(data?.roomId), isActive: true }, { $push: { userIds: ObjectId(data.userId) } })
        socket.room = data.roomId;
        socket.userId = data.userId;
        socket.join(data.roomId);

        socket.on('send_message', async (data) => {
            console.log('send_message', data);
            let { roomId, senderId, message } = data
            await roomModel.updateOne({ _id: ObjectId(data?.roomId), isActive: true }, { isActive: true })
            let messageData: any = await new messageModel({ senderId: ObjectId(senderId), message: message, roomId: ObjectId(roomId) }).save()
            data = { senderId, message, _id: messageData?._id, createdAt: messageData?.createdAt }
            io.to(socket?.id).emit('receive_message', data);
            socket.to(`${roomId}`).emit('receive_message', data)
        });
    });
    socket.on('left_room', function (data) {
        console.log('left_room');
        socket.leave(socket.room);
    });
})