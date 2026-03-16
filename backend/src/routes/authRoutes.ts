import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate, rateLimit } from '../middleware/authMiddleware';
import { validateAndSanitizeInput } from '../middleware/inputValidation';
import { createValidation, commonValidations } from '../middleware/inputValidation';
import { body } from 'express-validator';

const router = Router();

// Rate limiting for auth endpoints (stricter limits)
const authRateLimit = rateLimit({
  maxRequests: 10, // 10 attempts per hour
  windowSize: 3600, // 1 hour
  keyGenerator: (req) => `auth:${req.ip}`
});

const mfaRateLimit = rateLimit({
  maxRequests: 5, // 5 MFA attempts per 15 minutes
  windowSize: 900, // 15 minutes
  keyGenerator: (req) => `mfa:${req.ip}`
});

// Login validation
const loginValidation = createValidation([
  commonValidations.email(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
]);

// MFA validation
const mfaValidation = createValidation([
  body('userId')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
  body('token')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('MFA token must be 6 digits')
]);

// Refresh token validation
const refreshTokenValidation = createValidation([
  body('refreshToken')
    .isLength({ min: 1 })
    .withMessage('Refresh token is required')
]);

// MFA token validation
const mfaTokenValidation = createValidation([
  body('token')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('MFA token must be 6 digits')
]);

/**
 * @route POST /api/v1/auth/login
 * @desc User login
 * @access Public
 */
router.post('/login', 
  authRateLimit,
  validateAndSanitizeInput,
  loginValidation,
  authController.login
);

/**
 * @route POST /api/v1/auth/verify-mfa
 * @desc Verify MFA token
 * @access Public
 */
router.post('/verify-mfa',
  mfaRateLimit,
  validateAndSanitizeInput,
  mfaValidation,
  authController.verifyMFA
);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Refresh JWT token
 * @access Public
 */
router.post('/refresh',
  authRateLimit,
  validateAndSanitizeInput,
  refreshTokenValidation,
  authController.refreshToken
);

/**
 * @route POST /api/v1/auth/logout
 * @desc User logout
 * @access Private
 */
router.post('/logout',
  authenticate,
  authController.logout
);

/**
 * @route GET /api/v1/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile',
  authenticate,
  authController.getProfile
);

/**
 * @route POST /api/v1/auth/mfa/enable
 * @desc Enable MFA for user
 * @access Private
 */
router.post('/mfa/enable',
  authenticate,
  authController.enableMFA
);

/**
 * @route POST /api/v1/auth/mfa/confirm
 * @desc Confirm MFA setup
 * @access Private
 */
router.post('/mfa/confirm',
  authenticate,
  validateAndSanitizeInput,
  mfaTokenValidation,
  authController.confirmMFA
);

/**
 * @route POST /api/v1/auth/mfa/disable
 * @desc Disable MFA for user
 * @access Private
 */
router.post('/mfa/disable',
  authenticate,
  authController.disableMFA
);

export default router;