import { Router } from 'express';
import { createFolder, createFolderSchema, deleteFolder, listFolders, restoreFolder, trashFolder, updateFolder, updateFolderSchema } from '../controllers/folders.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../utils/validators.js';

const router = Router();

router.use(requireAuth);
router.get('/', listFolders);
router.post('/', validate(createFolderSchema), createFolder);
router.patch('/:id', validate(updateFolderSchema), updateFolder);
router.post('/:id/trash', trashFolder);
router.post('/:id/restore', restoreFolder);
router.delete('/:id', deleteFolder);

export default router;
