import { Request, Response, NextFunction } from 'express';
import { body, query, param, ValidationChain } from 'express-validator';
import { validateRequest } from './validateRequest';
import { logger } from '../utils/logger';
import { securityEventService } from '../services/securityEventService';
import xss from 'xss';

/**
 * Detect XSS attempts (simplified)
 */
export function detectXSS(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return /<script|on\w+=/i.test(input);
}

/**
 * Sanitize input using XSS library
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return input as any;
  return xss(input, {
    whiteList: {},          // No HTML tags allowed
    stripIgnoreTag: true,   // Remove disallowed tags
    stripIgnoreTagBody: ['script'], // Remove script content
  }).trim();
}

/**
 * SQL injection patterns
 */
const SQL_INJECTION_PATTERNS = [
  /('|(\\')|(;)|(\\;))/i,
  /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /union.*select/i,
  /select.*from/i,
  /insert.*into/i,
  /delete.*from/i,
  /update.*set/i,
  /drop.*table/i,
  /exec(\s|\+)+(s|x)p\w+/i
];

/**
 * XSS patterns
 */
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi
];

/**
 * Path traversal patterns
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi
];

/**
 * Command injection patterns
 */
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]]/,
  /\|\|/,
  /&&/,
  /\$\(/,
  /`.*`/
];

/**
 * Detect SQL injection attempts
 */
export function detectSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Detect path traversal attempts
 */
export function detectPathTraversal(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Detect command injection attempts
 */
export function detectCommandInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  return COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Comprehensive input validation and sanitization middleware
 */
export const validateAndSanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    const threats: string[] = [];
    const warnings: string[] = [];
    
    // Fields that should never contain user text (strict validation)
    const STRICT_FIELDS = ["id", "limit", "offset", "page", "sort", "order"];
    
    // Process request body
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value !== "string") continue;
      
      // 1️⃣ XSS detection → warn only
      if (/<script|on\w+=/i.test(value)) {
        warnings.push(`Possible XSS in field '${key}'`);
      }
      
      // 2️⃣ Strict blocking ONLY for machine fields
      if (STRICT_FIELDS.includes(key) && /('|--|;|\/\*)/.test(value)) {
        threats.push(`Invalid characters in '${key}'`);
      }
      
      // 3️⃣ Sanitize ALL string input
      req.body[key] = xss(value);
    }
    
    // Process query parameters
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value !== "string") continue;
      
      // XSS detection for query params
      if (/<script|on\w+=/i.test(value)) {
        warnings.push(`Possible XSS in query param '${key}'`);
      }
      
      // Strict validation for machine fields
      if (STRICT_FIELDS.includes(key) && /('|--|;|\/\*)/.test(value)) {
        threats.push(`Invalid characters in query param '${key}'`);
      }
      
      // Sanitize query parameters
      req.query[key] = xss(value);
    }
    
    // Block only if strict field violations found
    if (threats.length > 0) {
      // Log security event
      securityEventService.logEvent({
        event_type: 'security_violation',
        severity: 'high',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        resource: req.path,
        action: req.method,
        outcome: 'failure',
        error_message: threats.join(', '),
        metadata: {
          threats,
          blocked_input: { ...req.body, ...req.query },
          endpoint: `${req.method} ${req.path}`
        }
      }).catch(error => {
        logger.error('Failed to log security event:', error);
      });
      
      logger.warn('Security threat detected and blocked:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.path}`,
        threats
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid input detected',
        message: 'Your request contains invalid characters in system fields.'
      });
    }
    
    // Log warnings for XSS (but don't block)
    if (warnings.length > 0) {
      logger.info('Input sanitization applied:', {
        ip: req.ip,
        endpoint: `${req.method} ${req.path}`,
        warnings
      });
    }
    
    next();
  } catch (error) {
    logger.error('Input validation middleware error:', error);
    // Fail secure - block request if validation fails
    return res.status(500).json({
      success: false,
      error: 'Input validation failed',
      message: 'Unable to process request due to security validation error'
    });
  }
};

/**
 * Common validation chains
 */
export const commonValidations = {
  // Email validation
  email: () => body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Valid email address is required'),
  
  // Password validation
  password: () => body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must be 8-128 characters with uppercase, lowercase, number, and special character'),
  
  // Name validation
  name: (field: string) => body(field)
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(`${field} must contain only letters, spaces, hyphens, and apostrophes`),
  
  // ID validation
  id: (field: string = 'id') => param(field)
    .isInt({ min: 1 })
    .withMessage(`${field} must be a positive integer`),
  
  // UUID validation
  uuid: (field: string = 'id') => param(field)
    .isUUID()
    .withMessage(`${field} must be a valid UUID`),
  
  // Text content validation
  text: (field: string, maxLength: number = 1000) => body(field)
    .isLength({ min: 1, max: maxLength })
    .trim()
    .withMessage(`${field} must be 1-${maxLength} characters long`),
  
  // Optional text validation
  optionalText: (field: string, maxLength: number = 1000) => body(field)
    .optional()
    .isLength({ max: maxLength })
    .trim()
    .withMessage(`${field} must be at most ${maxLength} characters long`),
  
  // Phone number validation
  phone: (field: string = 'phone') => body(field)
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be 10-20 digits with optional country code'),
  
  // URL validation
  url: (field: string) => body(field)
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage(`${field} must be a valid HTTP/HTTPS URL`),
  
  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be between 1 and 1000'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  
  // Date validation
  date: (field: string) => body(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} must be a valid ISO 8601 date`),
  
  // Enum validation
  enum: (field: string, allowedValues: string[]) => body(field)
    .isIn(allowedValues)
    .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`)
};

/**
 * Create validation middleware chain
 */
export function createValidation(validations: ValidationChain[]): Array<ValidationChain | typeof validateRequest> {
  return [...validations, validateRequest];
}

/**
 * File upload validation
 */
export const validateFileUpload = (allowedTypes: string[], maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file && !req.files) {
      return next();
    }
    
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    
    for (const file of files) {
      if (!file) continue;
      
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type',
          message: `Only ${allowedTypes.join(', ')} files are allowed`
        });
      }
      
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: 'File too large',
          message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
        });
      }
      
      // Check for malicious file names (simple path traversal check)
      if (/\.\.\/|\.\.\\/.test(file.originalname)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file name',
          message: 'File name contains invalid characters'
        });
      }
    }
    
    next();
  };
};