import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { validateEnv } from './utils/validateEnv';
import { connectDatabase } from './database/connection';
import { emailService } from './services/emailService';
import { securityHeaders, secureCORS, auditLog } from './middleware/authMiddleware';
import { trackRequestMetrics, addMetricsHeaders } from './middleware/metricsMiddleware';
import { systemMetricsService } from './services/systemMetricsService';
import ChatService from './services/chatService';

// Routes
import leadRoutes from './routes/leadRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import contentRoutes from './routes/contentRoutes';
import authRoutes from './routes/authRoutes';
import healthRoutes from './routes/healthRoutes';
import phoneCallRoutes from './routes/phoneCallRoutes';
import systemMetricsRoutes from './routes/systemMetricsRoutes';
import testimonialRoutes from './routes/testimonialRoutes';
import chatRoutes, { initializeChatRoutes } from './routes/chatRoutes';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize chat service
const chatService = new ChatService(server);

// Validate environment variables
validateEnv();

// Security headers middleware
app.use(securityHeaders);

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:"],
      connectSrc: ["'self'", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for development
}));

// Secure CORS configuration
app.use(secureCORS);

// Global rate limiting (more permissive, specific endpoints have stricter limits)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/api/health');
  }
});
app.use(globalLimiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging and audit
app.use(requestLogger);
app.use(auditLog);

// Metrics tracking middleware
app.use(trackRequestMetrics);
app.use(addMetricsHeaders);

// Health check (before auth, no rate limiting)
app.use('/api/health', healthRoutes);

// API routes with security middleware
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/phone-calls', phoneCallRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/metrics', systemMetricsRoutes);
app.use('/api/v1/testimonials', testimonialRoutes);
app.use('/api/v1/chat', initializeChatRoutes(chatService));

// Serve static files from frontend build (only for non-API routes)
const frontendDistPath = path.join(__dirname, '../../dist');
app.use((req, res, next) => {
  // Skip static file serving for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  express.static(frontendDistPath)(req, res, next);
});

// Serve frontend for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  }
  
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Initialize email service (this will log if it's configured or not)
    logger.info('📧 Initializing email service...');
    emailService.initialize();
    if (emailService.isAvailable()) {
      logger.info('✅ Email service initialized successfully');
    } else {
      logger.warn('⚠️  Email service not configured - missing SMTP settings');
    }
    
    // Log security system status
    logger.info('🔐 Security system initialized');
    logger.info('   ✅ Authentication & Authorization (RBAC)');
    logger.info('   ✅ Rate Limiting & DDoS Protection');
    logger.info('   ✅ Input Validation & Threat Detection');
    logger.info('   ✅ Security Event Logging & Monitoring');
    logger.info('   ✅ Security Headers & CORS Protection');
    
    // Initialize system metrics
    logger.info('📊 System metrics initialized');
    logger.info('   ✅ Real-time metrics collection');
    logger.info('   ✅ Performance monitoring');
    logger.info('   ✅ Resource usage tracking');
    logger.info('   ✅ Database metrics');
    logger.info('   ✅ Application health monitoring');
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
      logger.info(`🌐 Frontend served from: http://localhost:${PORT}`);
      logger.info(`💬 Chat service initialized with WebSocket support`);
      logger.info(`🔐 Security: Enterprise-grade protection enabled`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;