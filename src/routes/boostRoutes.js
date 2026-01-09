import express from "express";
import { activateBoost } from "../controllers/boostController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/activate", authMiddleware, activateBoost);

export default router;
