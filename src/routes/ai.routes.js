import express from "express";
import { resumeEnhance } from "../controllers/ai.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/resume-enhance", authMiddleware, resumeEnhance);

export default router;
