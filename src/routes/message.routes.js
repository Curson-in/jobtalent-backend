import express from "express";
import {
  sendFollowUpMessage,
  getFollowUpsForJob
} from "../controllers/message.controller.js";

import {
  authMiddleware,
  requireRole
} from "../middleware/auth.js";

const router = express.Router();

// Candidate sends follow-up
router.post(
  "/",
  authMiddleware,
  sendFollowUpMessage
);

// Employer fetches follow-ups for a job
router.get(
  "/job/:jobId",
  authMiddleware,
  requireRole(["employer"]),
  getFollowUpsForJob
);

export default router;
