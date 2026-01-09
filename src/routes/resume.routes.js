import express from "express";
import { enhanceResume } from "../controllers/resume.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/enhance",
  authMiddleware,
  upload.single("resume"),
  enhanceResume
);

export default router;
