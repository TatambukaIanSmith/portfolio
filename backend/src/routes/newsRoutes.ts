import { Router } from 'express';
import { getNews, getCategories } from '../controllers/newsController';
import { validateRequest } from '../middleware/validateRequest';
import { query } from 'express-validator';

const router = Router();

// Validation middleware for news endpoints
const newsValidation = [
  query('category')
    .optional()
    .isIn(['general', 'business', 'technology', 'sports', 'health', 'science', 'entertainment', 'music', 'tourism', 'fashion', 'food', 'animals', 'environment'])
    .withMessage('Invalid category'),
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Page must be between 1 and 10')
];

// Routes
router.get('/', newsValidation, validateRequest, getNews);
router.get('/categories', getCategories);

export default router;