import { Router } from 'express'
import { apiResponse, file_path } from '../common'
import { Request, Response } from 'express'
import {  image_upload_response, uploadS3 } from '../helper'
const router = Router()


//to check image coming from right end.
const file_type = async (req: Request, res: Response, next: any) => {
    console.log(req.params);
    if (!file_path.includes(req.params.file)) return res.status(400).json(await apiResponse(400, 'invalid file type in upload', { action: file_path }, {}))
    next();
}

//user/:file = "profile" file is based on your folder name in aws....
router.post('/:file', file_type , uploadS3.single('image') , image_upload_response);   //to upload image give the params like profiles


export const uploadRouter = router