import { Router } from 'express';
import { checkDatabaseHealth } from '../database/connection';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  
  const health = {
    status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealth,
    },
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}));

export default router;