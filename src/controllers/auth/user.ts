import { Request, Response } from "express";
import moment from "moment";
import { apiResponse } from "../../common"
import { responseMessage } from "../../helper";
import { send_signup_otp } from "../../helper"
import { reqInfo } from "../../helper"
import jwt from "jsonwebtoken"
import config from "config"
import axios from "axios";
import { studentModel, librarianModel, adminModel } from "../../database";
const objectId: any = require("mongoose").Types.objectId;


const specify_model_asper_role = (role) => {
    if (role == "student") return studentModel;
    if (role == "librarian") return librarianModel;
    if (role == "admin") return adminModel;
    // if(role == "semiLibrarian") return semiLibrarian;z
    return null;
}

export const signup_google = async (req, res) => {

    reqInfo(req);
    const body = req.body;  //name email phoneNumber imageUrl role

    let model = specify_model_asper_role(body.role);
    if (!model) return res.status(404).json(await apiResponse(404, "please provide appropriate role", {}, {}));

    try {
        let user: any = await model.findOne({ email: body?.email, isActive: true });
        let userWithPhone: any = await model.findOne({ phoneNumber: body?.phoneNumber, isActive: true });
        // console.log(user);
        if (user) {
            return res.status(400).json(await apiResponse(400, responseMessage.alreadyEmail, {}, {}));
        }
        else if (userWithPhone) {
            return res.status(400).json(await apiResponse(400, "phone number exist alredy!!", {}, {}));
        }
        //else register new user

        //otp creation
        const otp = Math.floor(300000 + Math.random() * 500000)
        const otpExpierTime = new Date(new Date().getTime() + 5 * 60000);   // will expier in 5 miniut


        //creating body to save it in user mode
        body.otp = otp
        body.otpExpierTime = otpExpierTime


        //saving user to model
        const savedUser = await new model(body).save();

        if (!savedUser) {
            return res.status(501).json(await apiResponse(501, "invalid user data", {}, {}));
        }
        //user saved succesfully now send otp to the user

        let otpSended = await send_signup_otp("91", body.phoneNumber, `otp from QuitPaper: ${otp}`);

        if (!otpSended) {
            //tap on resend otp
            await model.findOneAndUpdate({ email: body.email }, { otp: null });
            return res.status(501).json(await apiResponse(501, "error in sending otp tap on resend otp", {}, {}));
        }
        //otp sended
        return res.status(200).json(await apiResponse(200, responseMessage?.signupSuccess, body, {}));
    }
    catch (error) {
        console.log("error", error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error));
    }

}

export const otp_verification = async (req, res) => {
    reqInfo(req);
    let body = req.body;  //expecting otp and phoneNumber and role

    let model = specify_model_asper_role(body.role);
    if (!model) return res.status(404).json(await apiResponse(404, "please provide appropriate role", {}, {}));

    let otp = body.otp;

    try {
        let response = await model.findOne({ phoneNumber: body?.phoneNumber });
        if (!response) {
            return res.status(404).json(await apiResponse(404, responseMessage?.invalidOTP, null, {}))
        }
        if (otp != response?.otp) {
            return res.status(410).json(await apiResponse(410, "otp is not valid & retry", null, {}));
        }

        const timeDiff = new Date().getTime() - new Date(response.otpExpierTime).getTime(); //expiertime is 5 miniut
        if (timeDiff > 0) {
            await model.findOneAndUpdate({ phoneNumber: body?.phoneNumber }, { otp: null, otpExpierTime: null });
            return res.status(410).json(await apiResponse(410, responseMessage?.expireOTP, null, {}))
        }
        const token = jwt.sign({
            _id: response?._id,
            role: response?.role,
            status: "Login",
            generatedOn: new Date().getTime()
        }, config.get("jwt_token_secret"));


        //add date & token to db.
        await model.findOneAndUpdate({ _id: response?._id },
            {
                signupDate: new Date(),
                token: token,
                isLoggedIn: true,
                isOTPVerified: true,
                lastLogin: new Date(),
                otp: null,
                otpExpierTime: null
            });

        const data = {   //login user_data + token
            response,
            token,
        }
        return res.status(200).json(await apiResponse(200, responseMessage?.OTPverified, data, {}))


    }
    catch (error) {
        console.log("error", error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error))
    }
}

export const login_phoneNumber = async (req, res) => //role phoneNumber
{
    reqInfo(req);
    let body = req.body   //expecting phoneNumber

    let model = specify_model_asper_role(body.role);
    if (!model) return res.status(404).json(await apiResponse(404, "please provide appropriate role", {}, {}));

    try {
        let response: any = await model.findOneAndUpdate({ phoneNumber: body?.phoneNumber, isActive: true }, { lastLogin: new Date() });

        if (!response) {
            return res.status(404).json(await apiResponse(404, "phonenumber not found", null, {}))
        }
        if (!response.isOTPVerified) {
            const deletedUser = await model.deleteOne({ email: body?.email });
            return res.status(404).json(await apiResponse(404, "bad login!!please sign up first", null, {}))
        }

        const otp = Math.floor(300000 + Math.random() * 500000)
        const otpExpierTime = new Date(new Date().getTime() + 5 * 60000);

        await model.findOneAndUpdate({ phoneNumber: body?.phoneNumber, isActive: true }, { otp: otp, otpExpierTime: otpExpierTime })

        return res.status(200).json(await apiResponse(200, "otp sended!!", response, {}))
    }
    catch (error) {
        console.log("error", error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error))
    }
}

export const resend_otp = async (req, res) => {
    reqInfo(req)
    let body = req.body; //required id or email of user and role

    let model = specify_model_asper_role(body.role);
    if (!model) return res.status(404).json(await apiResponse(404, "please provide appropriate role", {}, {}));

    try {
        //resetting otp
        const otp = Math.floor(300000 + Math.random() * 500000)
        const otpExpierTime = new Date(new Date().getTime() + 5 * 60000);


        const response = await model.findOneAndUpdate({ email: body?.email, isActive: true }, { otp: otp, otpExpierTime: otpExpierTime, isOTPVerified: false });
        if (!response) {
            return res.status(404).json(await apiResponse(404, responseMessage?.invalidOTP, null, {}))
        }

        //user saved succesfully now send otp to the user
        let otpSended = await send_signup_otp("91", response.phoneNumber, `otp from QuitPaper : ${otp}`);

        if (!otpSended) {
            //tap on resend otp
            await model.findOneAndUpdate({ email: response.email }, { otp: null, otpExpierTime: null });
            return res.status(501).json(await apiResponse(501, "error in sending otp from server tap on resend otp", {}, {}));
        }
        //otp sended
        return res.status(200).json(await apiResponse(200, "otp-sended succesfully", {}, {}));
    }
    catch (error) {
        console.log("error", error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error))
    }
}

export const google_SL = async (req: Request, res: Response) => {  //role accessToken and idtoken
    reqInfo(req);
    let body = req.body;
    let { accessToken, idToken } = req.body;
    let model = specify_model_asper_role(body.role);
    if (!model) return res.status(404).json(await apiResponse(404, "please provide appropriate role", {}, {}));
    try {
        if (accessToken && idToken) {
            let verificationAPI = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`,
                idAPI = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;

            let access_token: any = await axios.get(verificationAPI)
                .then((result) => {
                    return result.data
                }).catch((error) => {
                    return false;
                })
            let id_token: any = await axios.get(idAPI)
                .then((result) => {
                    return result.data
                }).catch((error) => {
                    return false
                })
            if (access_token.email == id_token.email && access_token.verified_email == true) {

                const isUser = await model.findOne({ email: id_token?.email, isActive: true })
                if (!isUser) {
                    //new user
                    let response = {
                        email: id_token.email,
                        name: id_token.given_name + " " + id_token.family_name,
                        image: id_token.picture,
                        isEmailVerified: true,
                        _id: isUser._id,
                        logintype: "google"
                    }

                    return res.status(200).json(await apiResponse(200, responseMessage?.loginSuccess, response, {}));

                } else {
                    //existing user 
                    if (!isUser.isOTPVerified) {
                        return res.status(404).json(await apiResponse(404, "bad login!!please sign up first", null, {}))

                    }
                    //otp verifed + existing user => send token 
                    const token = jwt.sign({
                        _id: isUser._id,
                        role: "student",
                        status: "Login",
                        generatedOn: (new Date().getTime())
                    }, config.get("jwt_token_secret"))
                    return res.status(200).json(await apiResponse(200, responseMessage?.loginSuccess, { token, userData: isUser }, {}));
                }
            }
            //acccestoken and idtoken is not valid
            return res.status(401).json(await apiResponse(401, responseMessage?.invalidIdTokenAndAccessToken, {}, {}))
        }
    } catch (error) {
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}

export const logout = async (req, res) => //role needed
{
    reqInfo(req);
    let body = req.body;

    let model = specify_model_asper_role(body.role);
    if (!model) return res.status(404).json(await apiResponse(404, "please provide appropriate role", {}, {}));

    // console.log(req.headers);
    try {
        let { user } = req.headers;
        // console.log(user);

        if (!user) {
            return res.status(404).json(await apiResponse(404, "token not found", null, null));
        }
        //we have user
        let response = await model.findOneAndUpdate({ _id: user._id, isActive: true }, { isLoggedIn: false });
        console.log(response);
        if (!response) return res.status(404).json(await apiResponse(404, "user not found in db", null, null));

        return res.status(200).json(await apiResponse(200, "logout complete", null, {}));
    }
    catch (error) {
        console.log("error", error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error))
    }

}