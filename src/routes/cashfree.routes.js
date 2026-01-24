import express from "express";
import {
  createCashfreeOrder,
  verifyCashfreePayment
} from "../controllers/cashfreeController.js";
import { authMiddleware } from "../middleware/auth.js";



const router = express.Router();

router.post(
  "/cashfree/create-order",
  authMiddleware,
  createCashfreeOrder
);

router.get("/cashfree/verify", verifyCashfreePayment);

export default router;
