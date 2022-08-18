import express from "express";
const router = express.Router();
import { studentController } from '../controllers/user'

router.post("/getNearByLibraries", studentController.getNearByLibraries);

//paytm and order
router.post("/paytm/order", studentController.isLibraryFull , studentController.makeOrder );
router.post('/paytm/transaction_status', studentController.paytm_transaction_status);
router.post("/paytm/cancelPayment" , studentController.cancel_payment);
router.post("/bookSeat" , studentController.bookSeat);


//testing apis
router.post("/test", studentController.test);
export const studentRouter = router;