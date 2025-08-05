import { Router } from 'express';
import {
  signup,
  login,
  googleAuth,
  googleCallback,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  getProfile,
  migrateDeviceData,
  logout
} from '../controllers/authController';
import { requireAuth, requireEmailVerification } from '../middleware/auth';

const router = Router();

// Custom authentication routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// Email verification
router.get('/verify-email/:token', verifyEmail);

// Password reset
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Protected routes
router.get('/profile', requireAuth, getProfile);
router.post('/migrate-device-data', requireAuth, migrateDeviceData);

export default router;