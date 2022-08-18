import express from "express";
import { authController } from '../controllers';
import {send_signup_otp, JWT} from "../helper"
const router = express.Router();



//---->localhost:80/user/...
router.post('/signUp',authController.signup_google);
router.post("/verifyOtp", authController.otp_verification);
router.post("/resendOtp", authController.resend_otp);
router.post("/loginUsingPhone" , authController.login_phoneNumber);

// router.post("/login" , userController.login);

router.use(JWT);
router.post("/logout" , authController.logout);




export const userRouter = router;