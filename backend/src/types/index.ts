// Re-export all types for easy importing
export * from './Lead';

// Common API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Database types
export interface DatabaseRow {
  id: string | number;
  created_at: Date;
  updated_at: Date;
}

// Request types
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Environment types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  FRONTEND_URL: string;
  GOOGLE_GEMINI_API_KEY?: string;
  UPLOAD_MAX_SIZE: number;
  UPLOAD_ALLOWED_TYPES: string;
  LOG_LEVEL: string;
}