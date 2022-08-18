import express from "express";
import { adminController, librarianController } from "../controllers/user";
const router = express.Router();



router.post("/getAllLibraries", adminController.getAllLibraries);
router.post("/deActiveLibrary", adminController.deActiveLibraryById);
router.post("/getLibrarySections", adminController.getLibrarySections);
router.post("/addSemiAdmin", adminController.addSemiAdmin);








export const adminRouter = router;