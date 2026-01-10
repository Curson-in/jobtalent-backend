import express from "express";
import path from "path";
import fs from "fs";
import { RESUME_DIR, AI_RESUME_DIR } from "../utils/storagePaths.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/resume/:filename", authMiddleware, (req, res) => {
  const filePath = path.join(RESUME_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.sendStatus(404);
  res.sendFile(filePath);
});

router.get("/ai-resume/:filename", authMiddleware, (req, res) => {
  const filePath = path.join(AI_RESUME_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.sendStatus(404);
  res.sendFile(filePath);
});

export default router;
