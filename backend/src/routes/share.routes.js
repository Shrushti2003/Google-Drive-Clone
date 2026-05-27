import { Router } from 'express';
import { createShare, createShareSchema, myShares, resolveShare, revokeShare } from '../controllers/share.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../utils/validators.js';

const router = Router();

router.get('/public/:token', resolveShare);
router.use(requireAuth);
router.get('/', myShares);
router.post('/', validate(createShareSchema), createShare);
router.delete('/:id', revokeShare);

export default router;
