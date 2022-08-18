import mongoose from "mongoose";
const schema = mongoose.Schema;


const librarianSchema = new schema({

    name : {
        type : String,
        required:true 
    },
    email : {
        type : String,
        required:true 
    },
    gender : {
        type : String,
    },
    role : {
        type: String,
        default : "librarian"        
    },
    phoneNumber :{  
        type : String,
        required : true
    },
    otp : {
        type : Number,
        default : null
    },
    otpExpierTime : {
        type : Date ,
        default : null

    },
    isOTPVerified : {
        type : Boolean,
        default : false
    },
    isLoggedIn : {
        type: Boolean,
        default :false
    },
    signupDate : {
        type : Date ,
    },
    token : {
        type :String, 
    },
    lastLogin : {
        type : Date ,
        default : null
    },
    isActive: { type: Boolean, default: true },
    isUserActive : {type : Boolean }   //true=> allowed  false=>blocked used in jwt token



} , {timestamps : true}) ;


export const librarianModel = mongoose.model("Librarian" , librarianSchema);