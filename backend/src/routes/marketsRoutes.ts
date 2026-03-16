import { Router } from 'express';
import { 
  getForexRates, 
  getStockQuote, 
  getMarketIndices, 
  getPopularForexPairs 
} from '../controllers/marketsController';
import { validateRequest } from '../middleware/validateRequest';
import { query, param } from 'express-validator';

const router = Router();

// Validation middleware
const forexValidation = [
  query('from')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency code must be 3 characters'),
  query('to')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency code must be 3 characters')
];

const stockValidation = [
  param('symbol')
    .isLength({ min: 1, max: 10 })
    .withMessage('Stock symbol must be between 1 and 10 characters')
    .matches(/^[A-Z]+$/)
    .withMessage('Stock symbol must contain only uppercase letters')
];

// Routes
router.get('/forex', forexValidation, validateRequest, getForexRates);
router.get('/forex/popular', getPopularForexPairs);
router.get('/stocks/:symbol', stockValidation, validateRequest, getStockQuote);
router.get('/indices', getMarketIndices);

export default router;