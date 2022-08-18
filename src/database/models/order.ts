import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, ref: "Student" },
    libId: { type: mongoose.Types.ObjectId, ref: "library" },
    sectionId: { type: mongoose.Types.ObjectId, ref: "librarySection" },
    shift: { type: String },
    duration: { type: Number },
    bookingStartDate: { type: Date },
    bookingEndDate: { type: Date },
    seatNo: {type :Number},
    //status can be connected,disconnected,expired
    paymentId: { type: String },
    isPaymentDone : {type : Boolean, default : false},  // when order save payment will be false once payment confirmation come from frontend this field will be true
    fees: { type: Number },
    isActive : {type : Boolean , default : true},

}, { timestamps: true })

export const orderModel = mongoose.model('order', orderSchema)