"use strict"
import { apiResponse, } from '../../common'
import { Request, Response } from 'express'
import { messageModel } from '../../database/models/message'
import { reqInfo, responseMessage } from '../../helper'

const ObjectId = require('mongoose').Types.ObjectId

export const get_message = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user'), { roomId } = req.query
    try {

        let response = await messageModel.aggregate([
            { $match: { roomId: ObjectId(roomId), isActive: true } },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    message: 1, senderId: 1, createdAt: 1
                }
            }
        ])
        return res.status(200).json(await apiResponse(200, responseMessage?.getDataSuccess('message by roomId'), response, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}
