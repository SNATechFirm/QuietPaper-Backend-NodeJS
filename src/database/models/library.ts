import mongoose from "mongoose";
const schema = mongoose.Schema;


const librarySchema = new schema({

    libraryName: { type: String, default: null },
    images: [{ type: String, default: null }],
    gpsAddress: {
        longitude: { type: Number, default: null },
        latitude: { type: Number, default: null }
    },
    manualAddress: {
        city: { type: String, default: null },
        state: { type: String, default: null }
    },
    facility: {
        water: { type: Boolean, default: false },
        discussionRoom: { type: Boolean, default: false },
        lunchRoom: { type: Boolean, default: false },
        coffee: { type: Boolean, default: false },
        tea: { type: Boolean, default: false },
        wifi: { type: Boolean, default: false },
        ac: { type: Boolean, default: false },
        newspaper: { type: Boolean, default: false },
        parking: { type: Boolean, default: false },
    },
    bankDetails: {
        name: { type: String },
        accountNumber: { type: Number },
        ifscCode: { type: String },
        upiId: { type: String },
        mobileNumber: { type: String }
    },
    description: { type: String, default: null },
    students : [{
        userId : {type: mongoose.Types.ObjectId, required: true, ref: "Student" }  ,
        latestOrder : {type : mongoose.Types.ObjectId, required: true, ref: "order"}
    }],
    roomId: { type: mongoose.Types.ObjectId, ref: "room" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Types.ObjectId, required: true, ref: "Librarian" },
    updatedBy: { type: mongoose.Types.ObjectId }

}, { timestamps: true });


export const libraryModel = mongoose.model("library", librarySchema);