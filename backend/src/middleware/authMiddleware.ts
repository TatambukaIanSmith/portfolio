import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { authorizationService } from '../services/authorizationService';
import { rateLimitService } from '../services/rateLimitService';
import { securityEventService } from '../services/securityEventService';
import { logger } from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      rateLimitInfo?: any;
    }
  }
}

/**
 * Authentication middleware - validates JWT tokens
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Validate session and get user
    const user = await authService.validateSession(token);
    
    if (!user) {
      await securityEventService.logEvent({
        event_type: 'login_failed',
        severity: 'medium',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        resource: req.path,
        action: req.method,
        outcome: 'failure',
        error_message: 'Invalid or expired token'
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Authentication token is invalid or expired'
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    
    await securityEventService.logEvent({
      event_type: 'security_violation',
      severity: 'high',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      resource: req.path,
      action: req.method,
      outcome: 'error',
      error_message: 'Authentication middleware error'
    });

    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'Unable to process authentication'
    });
  }
};

/**
 * Optional authentication middleware - allows both authenticated and anonymous access
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authService.validateSession(token);
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    // Continue without authentication for optional auth
    next();
  }
};

/**
 * Authorization middleware - checks permissions
 */
export const authorize = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Please authenticate to access this resource'
        });
      }

      const hasPermission = await authorizationService.checkPermission(
        req.user.id,
        resource,
        action,
        {
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          endpoint: req.path
        }
      );

      if (!hasPermission) {
        await securityEventService.logEvent({
          event_type: 'permission_revoked',
          severity: 'medium',
          user_id: req.user.id,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          resource,
          action,
          outcome: 'failure',
          error_message: 'Insufficient permissions'
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `You don't have permission to ${action} ${resource}`
        });
      }

      next();
    } catch (error) {
      logger.error('Authorization middleware error:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Authorization error',
        message: 'Unable to verify permissions'
      });
    }
  };
};

/**
 * Rate limiting middleware
 */
export const rateLimit = (options: {
  maxRequests?: number;
  windowSize?: number; // in seconds
  keyGenerator?: (req: Request) => string;
}) => {
  const {
    maxRequests = 100,
    windowSize = 3600, // 1 hour
    keyGenerator = (req: Request) => req.ip
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = keyGenerator(req);
      const endpoint = `${req.method}:${req.route?.path || req.path}`;
      
      // Check rate limit
      const rateLimitResult = await rateLimitService.checkRateLimit(
        endpoint,
        identifier,
        maxRequests,
        windowSize
      );

      // Add rate limit info to response headers
      res.set({
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString()
      });

      if (!rateLimitResult.allowed) {
        if (rateLimitResult.retryAfter) {
          res.set('Retry-After', rateLimitResult.retryAfter.toString());
        }

        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again ${rateLimitResult.retryAfter ? `in ${rateLimitResult.retryAfter} seconds` : 'later'}.`,
          retryAfter: rateLimitResult.retryAfter
        });
      }

      // Increment counter for successful requests
      await rateLimitService.incrementCounter(endpoint, identifier);
      
      // Attach rate limit info to request
      req.rateLimitInfo = rateLimitResult;
      
      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
};

/**
 * Role-based access control middleware
 */
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please authenticate to access this resource'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient role',
        message: `This endpoint requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Admin-only access middleware
 */
export const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Super admin-only access middleware
 */
export const requireSuperAdmin = requireRole('super_admin');

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';"
  });

  next();
};

/**
 * CORS middleware with security considerations
 */
export const secureCORS = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://iansmith.dev',
    'https://www.iansmith.dev'
  ];

  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }

  res.set({
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400' // 24 hours
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

/**
 * Request logging middleware for security audit
 */
export const auditLog = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('API Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    logger.info('API Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userId: req.user?.id,
      success: body?.success !== false
    });

    return originalJson.call(this, body);
  };

  next();
};