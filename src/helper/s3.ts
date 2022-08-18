"use strict"
import multer from 'multer'
import AWS from 'aws-sdk'
import config from 'config'
import { logger, reqInfo } from './winston_logger'
import multerS3 from 'multer-s3'
import { Request, Response } from 'express'
import { apiResponse } from '../common'
import multer_s3_transform from 'multer-s3-transform'
import sharp from 'sharp'

const aws :any = config.get("aws");

const s3 = new AWS.S3({
    accessKeyId: aws.accessKeyId,
    secretAccessKey: aws.secretAccessKey,
    region: aws.region
})
const bucket_name = aws.bucket_name; 
const bucket_url = aws.bucket_url;

// https://quitpaper.s3.ap-south-1.amazonaws.com/myfolder/
// https://quitpaper.s3.ap-south-1.amazonaws.com/myfolder/
//s3://quitpaper/myfolder/

export const uploadS3 = multer({
    storage: multerS3({
        s3: s3,
        bucket: bucket_name,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req: any, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req: any, file, cb) {
            logger.info('file successfully upload')
            const file_type = file.originalname.split('.')
            req.body.location = `${bucket_url}/${req.header('user')?._id}/${req.params.file}/${Date.now().toString()}.${file_type[file_type.length - 1]}`
 
            cb(
                null,
                `/${req.params.file}/${Date.now().toString()}.${file_type[file_type.length - 1]}`  //userid/params/date.type
            );
        },
    }),
});

export const image_upload_response = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        // let file: any = req.file
        console.log(req.body.location);
        return res.status(200).json({
            status: 200,
            message: "Image successfully uploaded",
            // data: { image: file?.transforms[0]?.location }
            data: { image: req.body.location }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json(await apiResponse(500, 'Internal Server Error', {}, error));
    }
}

