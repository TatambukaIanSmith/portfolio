// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// Lead constants
export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
  CLOSED: 'closed'
} as const;

export const LEAD_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

export const LEAD_TYPE = {
  CONTACT: 'contact',
  PROJECT: 'project'
} as const;

// AI Analysis constants
export const AI_PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
} as const;

export const AI_CATEGORIES = [
  'Web Development',
  'Mobile App',
  'Consulting',
  'Maintenance',
  'Design',
  'General Inquiry'
] as const;

// Database constants
export const DB_TABLES = {
  USERS: 'users',
  LEADS: 'leads',
  ANALYTICS_EVENTS: 'analytics_events',
  BLOG_ARTICLES: 'blog_articles',
  PROJECTS: 'projects',
  SESSIONS: 'sessions',
  SETTINGS: 'settings',
  MEDIA_FILES: 'media_files',
  API_LOGS: 'api_logs'
} as const;

// Validation constants
export const VALIDATION_LIMITS = {
  NAME_MAX_LENGTH: 255,
  EMAIL_MAX_LENGTH: 255,
  MESSAGE_MAX_LENGTH: 5000,
  PROJECT_TYPE_MAX_LENGTH: 100,
  BUDGET_MAX_LENGTH: 50,
  SOURCE_MAX_LENGTH: 100,
  SUMMARY_MAX_LENGTH: 500,
  CATEGORY_MAX_LENGTH: 100
} as const;

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

// File upload constants
export const UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
  UPLOAD_DIR: './uploads'
} as const;

// JWT constants
export const JWT = {
  DEFAULT_EXPIRES_IN: '24h',
  REFRESH_EXPIRES_IN: '7d',
  ALGORITHM: 'HS256'
} as const;

// Rate limiting constants
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  SKIP_SUCCESSFUL_REQUESTS: false
} as const;

// Environment constants
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
} as const;