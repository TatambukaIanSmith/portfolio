import { Router } from 'express';
import { 
  getLeadAnalytics, 
  getSystemMetrics, 
  getSystemHealth 
} from '../controllers/analyticsController';

const router = Router();

/**
 * Analytics Routes
 * Base path: /api/v1/analytics
 */

// Lead analytics
router.get('/leads', getLeadAnalytics);

// System metrics for dashboard
router.get('/metrics/current', getSystemMetrics);
router.get('/metrics/health', getSystemHealth);

export default router;