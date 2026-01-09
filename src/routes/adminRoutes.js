import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/users', authMiddleware, requireRole([USER_ROLES.ADMIN]), adminController.getUsers);
router.put('/verify-employer/:userId', authMiddleware, requireRole([USER_ROLES.ADMIN]), adminController.verifyEmployer);
router.get('/stats', authMiddleware, requireRole([USER_ROLES.ADMIN]), adminController.getPlatformStats);

export default router;
