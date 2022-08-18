import express from "express";
import { librarianController } from "../controllers/user";
const router = express.Router();

//add library detalis
router.post("/addLibrary", librarianController.addLibrary);
router.post("/addSections", librarianController.addLibrarySections);
router.post("/addBankDetails", librarianController.addBankDetails);
router.post("/getSections", librarianController.getLibrarySections);

//get lib info
router.post("/getSeatInfo", librarianController.getLibrarySeatInfo);

//book offline user
router.post("/checkOfflineUserIsSignedUp", librarianController.checkOfflineUserIsSignedUp);
router.post("/bookOfflineUser", librarianController.bookOfflineUser);

//get history of students or students details
router.post("/getAllStudentDetails", librarianController.getAllStudentDetails);

//Library modification
router.post("/deActiveLibrary" , librarianController.deActiveLibraryById);
router.post("/addOrRemoveSeat" , librarianController.addOrRemoveSeat);
router.post("/blockUserFromChat" , librarianController.blockUserFromChat);


export const librarianRouter = router;