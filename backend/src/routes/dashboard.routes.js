import { Router } from 'express';
import { adminOverview, adminUsers, getDashboard } from '../controllers/dashboard.controller.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, getDashboard);
router.get('/admin', requireAuth, requireAdmin, adminOverview);
router.get('/admin/users', requireAuth, requireAdmin, adminUsers);

export default router;
