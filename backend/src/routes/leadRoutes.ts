import { Router } from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  updateAiAnalysis,
  getLeadStats,
  bulkUpdateLeads
} from '../controllers/leadController';
import { 
  optionalAuth, 
  authenticate, 
  authorize, 
  rateLimit, 
  requireAdmin 
} from '../middleware/authMiddleware';
import { validateAndSanitizeInput } from '../middleware/inputValidation';

const router = Router();

// Rate limiting for lead endpoints
const leadRateLimit = rateLimit({
  maxRequests: 50, // 50 requests per hour
  windowSize: 3600, // 1 hour
  keyGenerator: (req) => `leads:${req.user?.id || req.ip}`
});

const publicLeadRateLimit = rateLimit({
  maxRequests: 10, // 10 lead submissions per hour for anonymous users
  windowSize: 3600, // 1 hour
  keyGenerator: (req) => `public-leads:${req.ip}`
});

// Lead statistics (admin only)
router.get('/stats', 
  authenticate,
  requireAdmin,
  leadRateLimit,
  getLeadStats
);

// CRUD operations
router.post('/', 
  optionalAuth, // Allow both authenticated and anonymous lead creation
  publicLeadRateLimit,
  validateAndSanitizeInput,
  createLead
);

router.get('/', 
  authenticate,
  authorize('leads', 'read'),
  leadRateLimit,
  getLeads
);

router.get('/:id', 
  authenticate,
  authorize('leads', 'read'),
  leadRateLimit,
  getLeadById
);

router.put('/:id', 
  authenticate,
  authorize('leads', 'update'),
  leadRateLimit,
  validateAndSanitizeInput,
  updateLead
);

router.delete('/:id', 
  authenticate,
  authorize('leads', 'delete'),
  leadRateLimit,
  deleteLead
);

// AI analysis (admin only)
router.post('/:id/ai-analysis', 
  authenticate,
  requireAdmin,
  leadRateLimit,
  validateAndSanitizeInput,
  updateAiAnalysis
);

// Bulk operations (admin only)
router.patch('/bulk-update', 
  authenticate,
  requireAdmin,
  leadRateLimit,
  validateAndSanitizeInput,
  bulkUpdateLeads
);

export default router;