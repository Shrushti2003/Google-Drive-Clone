import { Router } from 'express';
import {
  copyFile,
  deleteFile,
  downloadFile,
  listFiles,
  previewFile,
  restoreFile,
  trashFile,
  updateFile,
  updateFileSchema,
  uploadFiles
} from '../controllers/files.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { validate } from '../utils/validators.js';

const router = Router();

router.use(requireAuth);
router.get('/', listFiles);
router.post('/upload', upload.array('files', 25), uploadFiles);
router.patch('/:id', validate(updateFileSchema), updateFile);
router.post('/:id/copy', copyFile);
router.post('/:id/trash', trashFile);
router.post('/:id/restore', restoreFile);
router.delete('/:id', deleteFile);
router.get('/:id/download', downloadFile);
router.get('/:id/preview', previewFile);

export default router;
