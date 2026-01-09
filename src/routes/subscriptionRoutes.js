import express from "express";
import {
  toggleAutoRenew
} from "../controllers/subscriptionController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.patch("/auto-renew", authMiddleware, toggleAutoRenew);

export default router;