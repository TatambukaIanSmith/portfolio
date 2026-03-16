/**
 * Security Types and Interfaces
 * Comprehensive type definitions for the security system
 */

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: AccessCondition[];
}

export interface AccessCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in';
  value: any;
}

export interface Session {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface JWTPayload {
  userId: string;
  sessionId: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MFAResult {
  valid: boolean;
  remainingAttempts?: number;
}

export interface RateLimitConfig {
  key: string;
  windowSize: number; // in seconds
  maxRequests: number;
  blockDuration?: number; // in seconds
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface ThreatAssessment {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  indicators: ThreatIndicator[];
  recommendedAction: 'allow' | 'block' | 'challenge' | 'monitor';
}

export interface ThreatIndicator {
  type: string;
  value: string;
  confidence: number;
  source: string;
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent?: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'error';
  metadata: Record<string, any>;
  timestamp: Date;
}

export type SecurityEventType = 
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'configuration_change'
  | 'security_violation'
  | 'threat_detected'
  | 'system_event';

export interface AuditLog {
  id: string;
  eventId: string;
  userId?: string;
  action: string;
  resource: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
  checksum: string;
}

export interface SecurityConfig {
  jwt: {
    secret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    issuer: string;
    audience: string;
  };
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // in days
  };
  session: {
    maxDuration: number; // in seconds
    maxConcurrent: number;
    extendOnActivity: boolean;
  };
  mfa: {
    issuer: string;
    window: number;
    backupCodeCount: number;
  };
  rateLimit: {
    global: RateLimitConfig;
    auth: RateLimitConfig;
    api: RateLimitConfig;
  };
  security: {
    maxFailedAttempts: number;
    lockoutDuration: number; // in seconds
    enableThreatDetection: boolean;
    enableAuditLogging: boolean;
  };
}

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AccessRequest {
  userId: string;
  resource: string;
  action: string;
  context?: Record<string, any>;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  conditions?: AccessCondition[];
  expiresAt?: Date;
}

export interface SecurityAlert {
  id: string;
  type: 'threat_detected' | 'policy_violation' | 'system_anomaly' | 'compliance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  metadata: Record<string, any>;
}

export interface IPReputation {
  ip: string;
  reputation: 'good' | 'suspicious' | 'malicious';
  confidence: number;
  sources: string[];
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

export interface GeolocationResult {
  allowed: boolean;
  country: string;
  countryCode: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  confidence: number;
}