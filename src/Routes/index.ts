"use strict"
import { Request, Router, Response } from 'express'
import { librarianRouter } from './librarian';
import { studentRouter } from './student';
import { uploadRouter } from './upload';
import { userRouter } from './user'
import { JWT } from "../helper"
import { adminRouter } from './admin';




const router = Router()

router.use("/user", userRouter);
router.use("/librarian", JWT, librarianRouter);
router.use("/user", uploadRouter);
router.use("/student", JWT, studentRouter);
router.use("/admin",JWT,adminRouter);



export { router }