import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  saveEmployerProfile,
  getEmployerProfile,
  updateEmployerProfile
} from '../controllers/employer.controller.js';

import { checkPlanLimit } from '../middleware/planGatekeeper.js';
import * as featureCtrl from '../controllers/employerFeatureController.js';

const router = express.Router();


router.get('/usage', authMiddleware, featureCtrl.getPlanUsage);
router.get('/search-candidates', authMiddleware, featureCtrl.searchCandidates); // Let controller handle limit/blur
router.post('/save-candidate', authMiddleware, checkPlanLimit('save'), featureCtrl.saveCandidate);
router.get('/saved-candidates', authMiddleware, featureCtrl.getSavedCandidates);
router.post('/invite-candidate', authMiddleware, featureCtrl.inviteCandidate);

router.post('/profile', authMiddleware, saveEmployerProfile);
router.get('/profile', authMiddleware, getEmployerProfile);
router.put('/profile', authMiddleware, updateEmployerProfile);


export default router;
