import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Placeholder routes - will be implemented in next tasks
router.get('/articles', asyncHandler(async (req, res) => {
  res.json({ message: 'Content routes - Coming soon!' });
}));

router.post('/articles', asyncHandler(async (req, res) => {
  res.json({ message: 'Create article - Coming soon!' });
}));

export default router;