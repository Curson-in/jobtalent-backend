import express from 'express';
import * as jobController from '../controllers/jobController.js';
import multer from 'multer';
import { authMiddleware, requireRole, optionalAuth } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';
import { uploadCompanyLogo } from '../controllers/profileController.js';
import upload from '../middleware/uploadPhoto.js';

const router = express.Router();



// 🔹 Employer / Admin job management
router.post(
  '/',
  authMiddleware,
  requireRole([USER_ROLES.EMPLOYER]),
  jobController.createJob
);

router.post(
  '/company-logo',
  authMiddleware,
  requireRole([USER_ROLES.EMPLOYER]),
  upload.single('logo'), // ✅ NOW DEFINED
  uploadCompanyLogo
);

// 🔹 PUBLIC TALENT FEED (DB ONLY)
router.get(
  '/feed',
  optionalAuth,
  jobController.getFeedJobs
);

// 🔹 Raw / general jobs (keep this)
router.get(
  '/',
  optionalAuth,
  jobController.getJobs
);

// 🔒 EMPLOYER ONLY - THEIR OWN JOBS
router.get(
  '/employer/my-jobs',
  authMiddleware,
  requireRole([USER_ROLES.EMPLOYER]),
  jobController.getEmployerJobs
);

// 🔹 Job detail
router.get('/:id', jobController.getJobById);

// 🔹 Delete job
router.delete(
  '/:id',
  authMiddleware,
  requireRole([USER_ROLES.EMPLOYER]),
  jobController.deleteJob
);

// 🔒 PREMIUM – JOB MATCH SCORE
router.get(
  '/:jobId/match-score',
  authMiddleware,
  requireRole([USER_ROLES.TALENT]),
  jobController.getJobMatchScore
);

router.put('/:id', authMiddleware, requireRole([USER_ROLES.EMPLOYER]), jobController.updateJob);

export default router;
