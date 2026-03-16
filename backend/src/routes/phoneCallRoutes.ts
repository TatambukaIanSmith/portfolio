import { Router } from 'express';
import {
  createPhoneCall,
  getPhoneCalls,
  getPhoneCallById,
  updatePhoneCall,
  deletePhoneCall,
  getPhoneCallStats,
} from '../controllers/phoneCallController';
import { 
  optionalAuth, 
  authenticate, 
  authorize, 
  rateLimit, 
  requireAdmin 
} from '../middleware/authMiddleware';
import { validateAndSanitizeInput } from '../middleware/inputValidation';

const router = Router();

/**
 * Phone Call Routes
 * Base path: /api/v1/phone-calls
 */

// Rate limiting for phone call endpoints
const phoneCallRateLimit = rateLimit({
  maxRequests: 30, // 30 requests per hour
  windowSize: 3600, // 1 hour
  keyGenerator: (req) => `phone-calls:${req.user?.id || req.ip}`
});

const publicPhoneCallRateLimit = rateLimit({
  maxRequests: 5, // 5 phone call requests per hour for anonymous users
  windowSize: 3600, // 1 hour
  keyGenerator: (req) => `public-phone-calls:${req.ip}`
});

// Create phone call request (public endpoint with rate limiting)
router.post('/', 
  optionalAuth, // Allow both authenticated and anonymous phone call requests
  publicPhoneCallRateLimit,
  validateAndSanitizeInput,
  createPhoneCall
);

// Get phone calls with filtering and pagination (admin only)
router.get('/', 
  authenticate,
  authorize('phone_calls', 'read'),
  phoneCallRateLimit,
  getPhoneCalls
);

// Get phone call statistics (admin only)
router.get('/stats', 
  authenticate,
  requireAdmin,
  phoneCallRateLimit,
  getPhoneCallStats
);

// Get phone call by ID (admin only)
router.get('/:id', 
  authenticate,
  authorize('phone_calls', 'read'),
  phoneCallRateLimit,
  getPhoneCallById
);

// Update phone call (admin only)
router.put('/:id', 
  authenticate,
  authorize('phone_calls', 'update'),
  phoneCallRateLimit,
  validateAndSanitizeInput,
  updatePhoneCall
);

// Delete phone call (admin only)
router.delete('/:id', 
  authenticate,
  authorize('phone_calls', 'delete'),
  phoneCallRateLimit,
  deletePhoneCall
);

export default router;