import mongoose from 'mongoose'

const qrSchema = new mongoose.Schema({

    //qrName
    libName : { type : String},
    sectionName : {type : String},
    seatNumber : {type: Number},

    //qr details
    libId : {type : mongoose.Types.ObjectId},
    sectionId : {type :mongoose.Types.ObjectId},
    totalSeats : {type : Number},


    isActive : {type : Boolean , default : true},

}, { timestamps: true })

export const qrModel = mongoose.model('qrcode', qrSchema)