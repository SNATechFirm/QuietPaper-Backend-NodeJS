
import { time } from "console";
import mongoose from "mongoose";
const schema = mongoose.Schema;


const sectionSchema = new schema({

    openingTime: { type: Date, required: true },
    closingTime: { type: Date, required: true },
    sectionId: { type: String, required: true },
    totalSeats: { type: Number },
    description: { type: String },
    price: { type: Number },
    seats: [
        {
            seatNo: { type: Number },
            seatUniqueId: { type: String },
            isShiftingSeat: { type: Boolean, default: false },
            persons: [
                {
                    name: { type: String },
                    imageUrl: { type: String, default: "https://pixabay.com/illustrations/icon-user-male-avatar-business-5359553/" },
                    uId: { type: mongoose.Types.ObjectId, ref: "studentModel" },
                    shift: {},
                    shiftingIntial: { type: Date },
                    shiftingEnd: { type: Date },
                    bookingStart: { type: Date },
                    bookingEnd: { type: Date },
                    status: { type: String }
                }
            ]

        }
    ],
    shifts: [
        {
            shiftId: { type: String },
            ShiftName: { type: String },
            startTime: { type: Date },
            endTime: { type: Date },
            price: { type: Number }
        }
    ],

    isActive: { type: Boolean, default: true },
    libraryId: { type: mongoose.Types.ObjectId, required: true, ref: "library" },
    createdBy: { type: mongoose.Types.ObjectId, required: true, ref: "Librarian" },
    updatedBy: { type: mongoose.Types.ObjectId }
}, { timestamps: true });


export const sectionModel = mongoose.model("librarySection", sectionSchema);