import { Router } from 'express';
import {
  createTestimonial,
  getTestimonials,
  getFeaturedTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  getTestimonialStats
} from '../controllers/testimonialController';

const router = Router();

// Public routes
router.get('/featured', getFeaturedTestimonials);

// Admin routes (add authentication middleware here when implemented)
router.post('/', createTestimonial);
router.get('/', getTestimonials);
router.get('/stats', getTestimonialStats);
router.get('/:id', getTestimonialById);
router.put('/:id', updateTestimonial);
router.delete('/:id', deleteTestimonial);

export default router;