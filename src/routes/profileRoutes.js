import express from 'express';
import * as profileController from '../controllers/profileController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';
import upload from '../middleware/upload.js';
import uploadPhoto from '../middleware/uploadPhoto.js';

const router = express.Router();

/* ========= TALENT ========= */

// CREATE / UPDATE TALENT PROFILE (ONBOARDING)
router.post(
  '/talent',
  authMiddleware,
  requireRole([USER_ROLES.TALENT]),
  upload.single('resume'),
  profileController.createTalentProfile
);

router.post(
  '/resume',
  authMiddleware,
  upload.single('resume'),
  profileController.uploadResume
);


// GET TALENT PROFILE
router.get(
  '/talent',
  authMiddleware,
  requireRole([USER_ROLES.TALENT]),
  profileController.getTalentProfile
);

// UPDATE TALENT PROFILE
router.put(
  '/talent',
  authMiddleware,
  requireRole([USER_ROLES.TALENT]),
  profileController.updateTalentProfile
);

/* ========= COMPANY ========= */

router.post(
  '/company',
  authMiddleware,
  requireRole([USER_ROLES.EMPLOYER]),
  profileController.createCompanyProfile
);

router.get(
  '/company',
  authMiddleware,
  requireRole([USER_ROLES.EMPLOYER]),
  profileController.getCompanyProfile
);

router.put(
  '/company',
  authMiddleware,
  requireRole([USER_ROLES.EMPLOYER]),
  profileController.updateCompanyProfile
);

router.post(
  '/photo',
  authMiddleware,
  uploadPhoto.single('photo'),
  profileController.uploadProfilePhoto
);


export default router;
