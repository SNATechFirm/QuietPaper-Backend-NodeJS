import jwt from 'jsonwebtoken'
import config from 'config'
import { adminModel, librarianModel, studentModel } from '../database'
import mongoose from 'mongoose'
import { apiResponse } from '../common'
import { Request, response, Response } from 'express'
import { responseMessage } from './response'

const ObjectId = require("mongoose").Types.ObjectId
const jwt_token_secret = config.get('jwt_token_secret');

const specify_model_asper_role = (role) => {
    if (role == "student") return studentModel;
    if (role == "librarian") return librarianModel;
    if (role == "admin" || role == "semiAdmin") return adminModel;
    // if(role == "semiLibrarian") return semiLibrarian;z
    return null;
}

export const JWT = async (req: Request, res: Response, next) => { //need authorization , role in header i willl check it with token then
    let { authorization } = req.headers,
        body = req.body,
        result: any;

    let model = specify_model_asper_role(body.role);
    if (!model) return res.status(404).json(await apiResponse(404, "please provide appropriate role", {}, {}));

    if (authorization) {
        try {
            let isVerifyToken = jwt.verify(authorization, jwt_token_secret);
            // console.log(isVerifyToken);
            if (isVerifyToken?.role != body.role) return res.status(403).json(await apiResponse(403, responseMessage?.accessDenied, {}, {}));

            if (process?.env?.NODE_ENV == 'production') {
                // 1 day expiration
                if (parseInt(isVerifyToken.generatedOn + 86400000) < new Date().getTime()) { //token will be exper in 1 day
                    // if (parseInt(isVerifyToken.generatedOn + 120000) < new Date().getTime()) {
                    return res.status(410).json(await apiResponse(410, responseMessage?.tokenExpire, {}, {}))
                }
            }

            result = await model.findOne({ _id: ObjectId(isVerifyToken._id), isActive: true })
            // console.log(result);
            if (result?.isUserActive == false)
                return res.status(403).json(await apiResponse(403, responseMessage?.accountBlock, {}, {}));

            if (result?.isActive == true) {
                // Set in Header Decode Token Information
                req.headers.user = result   //id role genratedon status="login"
                return next();
            }
            else {
                return res.status(401).json(await apiResponse(401, responseMessage?.invalidToken, {}, {}))
            }
        } catch (err) {
            if (err.message == "invalid signature") return res.status(403).json(await apiResponse(403, responseMessage?.differentToken, {}, {}))
            console.log(err)
            return res.status(401).json(await apiResponse(401, responseMessage.invalidToken, {}, {}))
        }
    } else {
        return res.status(401).json(await apiResponse(401, responseMessage?.tokenNotFound, {}, {}))
    }
}
