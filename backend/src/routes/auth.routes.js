import { Router } from 'express';
import {
  forgotPassword,
  forgotSchema,
  deleteAccount,
  googleCallback,
  googleCredential,
  googleCredentialSchema,
  googleStatus,
  googleStart,
  login,
  loginSchema,
  logout,
  me,
  refresh,
  register,
  registerSchema,
  resetPassword,
  resetSchema,
  verifyEmail
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import { validate } from '../utils/validators.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.delete('/me', requireAuth, deleteAccount);
router.post('/verify-email', requireAuth, verifyEmail);
router.post('/forgot-password', authLimiter, validate(forgotSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetSchema), resetPassword);
router.post('/google/credential', authLimiter, validate(googleCredentialSchema), googleCredential);
router.get('/google/status', googleStatus);
router.get('/google', authLimiter, googleStart);
router.get('/google/callback', googleCallback);

export default router;
