import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment
} from "../controllers/razorpayController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/razorpay/create-order", authMiddleware, createRazorpayOrder);
router.post("/razorpay/verify", authMiddleware, verifyRazorpayPayment);

export default router;
