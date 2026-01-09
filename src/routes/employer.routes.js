import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  saveEmployerProfile,
  getEmployerProfile,
  updateEmployerProfile
} from '../controllers/employer.controller.js';

const router = express.Router();

router.post('/profile', authMiddleware, saveEmployerProfile);
router.get('/profile', authMiddleware, getEmployerProfile);
router.put('/profile', authMiddleware, updateEmployerProfile);


export default router;
