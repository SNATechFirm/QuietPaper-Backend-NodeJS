
import { apiResponse, getUniqueId } from "../../common"
import { responseMessage } from "../../helper";
import { reqInfo } from "../../helper"
import { libraryModel } from "../../database/models/library";
import { sectionModel } from "../../database/models/librarySection";
import mongoose, { trusted } from "mongoose";
import { roomModel } from "../../database/models/room";
import { adminModel } from "../../database";
const ObjectId: any = mongoose.Types.ObjectId


export const getAllLibraries = async (req, res) => {
    reqInfo(req);
    let body = req.body,
        { user } = req.headers;

    try {
        const libs = await libraryModel.find().populate("createdBy", "name phoneNumber").select("createdBy createdBy libraryName");
        if (libs.length == 0) {
            return res.status(404).json(await apiResponse(404, "no libs found!", {}, {}));
        }
        return res.status(200).json(await apiResponse(200, "libs found", libs, {}));

    } catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}

export const deActiveLibraryById = async (req, res) => { //libId
    reqInfo(req);
    let body = req.body,
        { user } = req.headers;

    try {
        const lib = await libraryModel.findByIdAndUpdate(ObjectId(body.libId), { isActive: false }, { new: true });
        if (!lib)
            return res.status(404).json(await apiResponse(404, "library not found!", {}, {}));
        return res.status(200).json(await apiResponse(200, "library deactivated sucessfully!", lib, {}))

    } catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }

}

export const getLibrarySections = async (req, res) => {
    reqInfo(req);
    let body = req.body,
        { user } = req.headers;

    try {
        const sections = await sectionModel.find({ libraryId: ObjectId(body.libId) })
        if (sections.length == 0)
            return res.status(404).json(await apiResponse(400, "no sections found", {}, {}));

        return res.status(200).json(await apiResponse(200, "found sections", sections, {}));

    } catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error));
    }
}

export const addSemiAdmin = async (req, res) => {  //permission email password name image //registration of admin
    reqInfo(req);
    let { name, image, email, password, permissions, phoneNumber } = req.body,
        { user } = req.headers;

    try {

        const semiAdmin = {
            name: name,
            email: email,
            password: password,
            role: "semiAdmin",
            phoneNumber: phoneNumber,
            isOTPVerified: true,
            isLoggedIn: true,
            permissions: permissions,
        }

        const response = await new adminModel(semiAdmin).save();

        res.status(200).json(await apiResponse(200, "semiAdmin added sucessfully", response, {}));


    } catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error));
    }
}

