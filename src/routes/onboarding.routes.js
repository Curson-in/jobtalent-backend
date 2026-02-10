import express from 'express';
import { sendOnboardingOtp, verifyOnboardingOtp } from '../controllers/onboarding.controller.js';

const router = express.Router();

// These will be mounted under /api/onboarding
router.post('/send-otp', sendOnboardingOtp);
router.post('/verify-otp', verifyOnboardingOtp);

export default router;