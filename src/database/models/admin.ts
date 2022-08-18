import mongoose from "mongoose";
const schema = mongoose.Schema;


const adminSchema = new schema({

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
    },
    gender: {
        type: String,
    },
    role: {
        type: String,
        default: "admin"
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
    isLoggedIn: {
        type: Boolean,
        default: false
    },
    permissions: [{ type: Number }],  //[0,1,2,3]  ->>> 0 means able to see libraries
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
    isUserActive: { type: Boolean }   //true=> allowed  false=>blocked used in jwt token



}, { timestamps: true });


export const adminModel = mongoose.model("admin", adminSchema);