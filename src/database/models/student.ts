import mongoose from "mongoose";
const schema = mongoose.Schema;


const studentSchema = new schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    gender: {
        type: String,
    },
    role: {
        type: String,
        default: "student"
    },
    phoneNumber: {
        type: String,
        required: true
    },
    otp: {
        type: Number,
        default: null
    },
    otpExpierTime: {
        type: Date,
        default: null

    },
    isOTPVerified: {
        type: Boolean,
        default: false
    },
    //  visited libraries details
 
    isLoggedIn: {
        type: Boolean,
        default: false
    },
    signupDate: {
        type: Date,
    },
    token: {
        type: String,
    },
    lastLogin: {
        type: Date,
        default: null
    },

    isActive: { type: Boolean, default: true },
    isUserActive: { type: Boolean },
    isBaneFromChat : {type : Boolean , default : false} //true=> allowed  false=>blocked used in jwt token
    


}, { timestamps: true });


export const studentModel = mongoose.model("Student", studentSchema);