import { Router } from 'express';
import authRoutes from './auth.routes.js';
import billingRoutes from './billing.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import filesRoutes from './files.routes.js';
import foldersRoutes from './folders.routes.js';
import shareRoutes from './share.routes.js';
import stripeRoutes from './stripe.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/files', filesRoutes);
router.use('/folders', foldersRoutes);
router.use('/shares', shareRoutes);
router.use('/billing', billingRoutes);
router.use('/stripe', stripeRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
