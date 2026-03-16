import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/connection';
import { logger } from '../utils/logger';
import { securityEventService } from './securityEventService';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'super_admin' | 'user' | 'client' | 'guest';
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  mfa_enabled: boolean;
  mfa_secret?: string;
  backup_codes?: string[];
  failed_login_attempts: number;
  locked_until?: Date;
  last_login?: Date;
  password_changed_at: Date;
  is_active: boolean;
  last_login_at?: Date; // Legacy compatibility
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: number;
  token_hash: string;
  refresh_token_hash?: string;
  ip_address: string;
  user_agent?: string;
  device_fingerprint?: string;
  is_active: boolean;
  expires_at: Date;
  last_activity: Date;
  created_at: Date;
  revoked_at?: Date;
  revoked_reason?: string;
}

export interface MFASetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  session?: Session;
  requiresMFA?: boolean;
  error?: string;
  lockoutTime?: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SessionMetadata {
  ipAddress: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Authenticate user with email and password
   */
  async authenticate(
    email: string, 
    password: string, 
    metadata: SessionMetadata
  ): Promise<AuthResult> {
    try {
      // Get user by email
      const user = await this.getUserByEmail(email);
      if (!user) {
        await securityEventService.logEvent({
          event_type: 'login_failed',
          severity: 'medium',
          ip_address: metadata.ipAddress,
          user_agent: metadata.userAgent,
          outcome: 'failure',
          error_message: 'User not found',
          metadata: { email }
        });
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if account is locked
      if (user.locked_until && new Date() < user.locked_until) {
        await securityEventService.logEvent({
          event_type: 'login_failed',
          severity: 'high',
          user_id: user.id,
          ip_address: metadata.ipAddress,
          user_agent: metadata.userAgent,
          outcome: 'failure',
          error_message: 'Account locked',
          metadata: { email, locked_until: user.locked_until }
        });
        return { 
          success: false, 
          error: 'Account is locked', 
          lockoutTime: user.locked_until 
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        await this.handleFailedLogin(user, metadata);
        return { success: false, error: 'Invalid credentials' };
      }

      // Reset failed login attempts on successful password verification
      await this.resetFailedLoginAttempts(user.id);

      // Check if MFA is enabled
      if (user.mfa_enabled) {
        return {
          success: true,
          user,
          requiresMFA: true
        };
      }

      // Create session and tokens
      const tokens = await this.createSession(user, metadata);
      
      // Update last login
      await this.updateLastLogin(user.id);

      await securityEventService.logEvent({
        event_type: 'login',
        severity: 'low',
        user_id: user.id,
        ip_address: metadata.ipAddress,
        user_agent: metadata.userAgent,
        outcome: 'success',
        metadata: { email }
      });

      return {
        success: true,
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };

    } catch (error) {
      logger.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Verify MFA token and complete authentication
   */
  async verifyMFA(
    userId: number, 
    token: string, 
    metadata: SessionMetadata
  ): Promise<AuthResult> {
    try {
      const user = await this.getUserById(userId);
      if (!user || !user.mfa_enabled || !user.mfa_secret) {
        return { success: false, error: 'MFA not configured' };
      }

      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps (60 seconds) tolerance
      });

      if (!verified) {
        await securityEventService.logEvent({
          event_type: 'login_failed',
          severity: 'high',
          user_id: user.id,
          ip_address: metadata.ipAddress,
          user_agent: metadata.userAgent,
          outcome: 'failure',
          error_message: 'Invalid MFA token',
          metadata: { mfa_attempt: true }
        });
        return { success: false, error: 'Invalid MFA token' };
      }

      // Create session and tokens
      const tokens = await this.createSession(user, metadata);
      
      // Update last login
      await this.updateLastLogin(user.id);

      await securityEventService.logEvent({
        event_type: 'login',
        severity: 'low',
        user_id: user.id,
        ip_address: metadata.ipAddress,
        user_agent: metadata.userAgent,
        outcome: 'success',
        metadata: { mfa_verified: true }
      });

      return {
        success: true,
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };

    } catch (error) {
      logger.error('MFA verification error:', error);
      return { success: false, error: 'MFA verification failed' };
    }
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId: number): Promise<MFASetup> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Ian Smith Portfolio (${user.email})`,
        issuer: 'Ian Smith Portfolio'
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

      // Save secret and backup codes (but don't enable MFA yet)
      await db.execute(
        `UPDATE users 
         SET mfa_secret = ?, backup_codes = ? 
         WHERE id = ?`,
        [secret.base32, JSON.stringify(backupCodes), userId]
      );

      await securityEventService.logEvent({
        event_type: 'mfa_enabled',
        severity: 'medium',
        user_id: userId,
        ip_address: '127.0.0.1', // Internal action
        outcome: 'success',
        metadata: { action: 'mfa_setup_initiated' }
      });

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes
      };

    } catch (error) {
      logger.error('Enable MFA error:', error);
      throw error;
    }
  }

  /**
   * Confirm MFA setup with verification token
   */
  async confirmMFA(userId: number, token: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user || !user.mfa_secret) {
        return false;
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (verified) {
        // Enable MFA
        await db.execute(
          'UPDATE users SET mfa_enabled = TRUE WHERE id = ?',
          [userId]
        );

        await securityEventService.logEvent({
          event_type: 'mfa_enabled',
          severity: 'medium',
          user_id: userId,
          ip_address: '127.0.0.1',
          outcome: 'success',
          metadata: { action: 'mfa_confirmed' }
        });

        return true;
      }

      return false;
    } catch (error) {
      logger.error('Confirm MFA error:', error);
      return false;
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: number): Promise<boolean> {
    try {
      await db.execute(
        `UPDATE users 
         SET mfa_enabled = FALSE, mfa_secret = NULL, backup_codes = NULL 
         WHERE id = ?`,
        [userId]
      );

      await securityEventService.logEvent({
        event_type: 'mfa_disabled',
        severity: 'medium',
        user_id: userId,
        ip_address: '127.0.0.1',
        outcome: 'success'
      });

      return true;
    } catch (error) {
      logger.error('Disable MFA error:', error);
      return false;
    }
  }

  /**
   * Create user session and JWT tokens
   */
  async createSession(user: User, metadata: SessionMetadata): Promise<TokenPair> {
    try {
      const sessionId = uuidv4();
      const accessToken = this.generateJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId
      });
      
      const refreshToken = this.generateRefreshToken({
        userId: user.id,
        sessionId
      });

      // Hash tokens for storage
      const tokenHash = await bcrypt.hash(accessToken, 10);
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

      // Calculate expiry
      const expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT);

      // Store session
      await db.execute(
        `INSERT INTO user_sessions 
         (id, user_id, token_hash, refresh_token_hash, ip_address, user_agent, 
          device_fingerprint, expires_at, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          sessionId,
          user.id,
          tokenHash,
          refreshTokenHash,
          metadata.ipAddress,
          metadata.userAgent || null,
          metadata.deviceFingerprint || null,
          expiresAt
        ]
      );

      return {
        accessToken,
        refreshToken,
        expiresIn: this.SESSION_TIMEOUT / 1000
      };

    } catch (error) {
      logger.error('Create session error:', error);
      throw error;
    }
  }

  /**
   * Validate JWT token and session
   */
  async validateSession(token: string): Promise<User | null> {
    try {
      // Verify JWT
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      // Get session
      const [sessions] = await db.execute(
        `SELECT * FROM user_sessions 
         WHERE id = ? AND is_active = TRUE AND expires_at > NOW()`,
        [decoded.sessionId]
      ) as any[];

      if (!sessions.length) {
        return null;
      }

      const session = sessions[0];

      // Verify token hash
      const isValidToken = await bcrypt.compare(token, session.token_hash);
      if (!isValidToken) {
        return null;
      }

      // Update last activity
      await db.execute(
        'UPDATE user_sessions SET last_activity = NOW() WHERE id = ?',
        [session.id]
      );

      // Get user
      return await this.getUserById(session.user_id);

    } catch (error) {
      logger.error('Validate session error:', error);
      return null;
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair | null> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      
      // Get session
      const [sessions] = await db.execute(
        `SELECT * FROM user_sessions 
         WHERE id = ? AND is_active = TRUE AND expires_at > NOW()`,
        [decoded.sessionId]
      ) as any[];

      if (!sessions.length) {
        return null;
      }

      const session = sessions[0];

      // Verify refresh token hash
      const isValidRefreshToken = await bcrypt.compare(refreshToken, session.refresh_token_hash);
      if (!isValidRefreshToken) {
        return null;
      }

      // Get user
      const user = await this.getUserById(session.user_id);
      if (!user) {
        return null;
      }

      // Generate new tokens
      const newAccessToken = this.generateJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: session.id
      });

      const newRefreshToken = this.generateRefreshToken({
        userId: user.id,
        sessionId: session.id
      });

      // Update session with new token hashes
      const newTokenHash = await bcrypt.hash(newAccessToken, 10);
      const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

      await db.execute(
        `UPDATE user_sessions 
         SET token_hash = ?, refresh_token_hash = ?, last_activity = NOW() 
         WHERE id = ?`,
        [newTokenHash, newRefreshTokenHash, session.id]
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.SESSION_TIMEOUT / 1000
      };

    } catch (error) {
      logger.error('Refresh token error:', error);
      return null;
    }
  }

  /**
   * Revoke session (logout)
   */
  async revokeSession(sessionId: string, reason: string = 'user_logout'): Promise<boolean> {
    try {
      await db.execute(
        `UPDATE user_sessions 
         SET is_active = FALSE, revoked_at = NOW(), revoked_reason = ? 
         WHERE id = ?`,
        [reason, sessionId]
      );

      return true;
    } catch (error) {
      logger.error('Revoke session error:', error);
      return false;
    }
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Private helper methods

  private generateJWT(payload: any): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
  }

  private generateRefreshToken(payload: any): string {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, { expiresIn: this.JWT_REFRESH_EXPIRES_IN });
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [users] = await db.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      ) as any[];

      return users.length > 0 ? users[0] : null;
    } catch (error) {
      logger.error('Get user by email error:', error);
      return null;
    }
  }

  private async getUserById(id: number): Promise<User | null> {
    try {
      const [users] = await db.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      ) as any[];

      return users.length > 0 ? users[0] : null;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      return null;
    }
  }

  private async handleFailedLogin(user: User, metadata: SessionMetadata): Promise<void> {
    try {
      const newFailedAttempts = user.failed_login_attempts + 1;
      let lockedUntil: Date | null = null;

      if (newFailedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
      }

      await db.execute(
        `UPDATE users 
         SET failed_login_attempts = ?, locked_until = ? 
         WHERE id = ?`,
        [newFailedAttempts, lockedUntil, user.id]
      );

      await securityEventService.logEvent({
        event_type: newFailedAttempts >= this.MAX_LOGIN_ATTEMPTS ? 'account_locked' : 'login_failed',
        severity: newFailedAttempts >= this.MAX_LOGIN_ATTEMPTS ? 'high' : 'medium',
        user_id: user.id,
        ip_address: metadata.ipAddress,
        user_agent: metadata.userAgent,
        outcome: 'failure',
        error_message: 'Invalid password',
        metadata: { 
          failed_attempts: newFailedAttempts,
          locked_until: lockedUntil?.toISOString()
        }
      });

    } catch (error) {
      logger.error('Handle failed login error:', error);
    }
  }

  private async resetFailedLoginAttempts(userId: number): Promise<void> {
    try {
      await db.execute(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
        [userId]
      );
    } catch (error) {
      logger.error('Reset failed login attempts error:', error);
    }
  }

  private async updateLastLogin(userId: number): Promise<void> {
    try {
      await db.execute(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [userId]
      );
    } catch (error) {
      logger.error('Update last login error:', error);
    }
  }
}

export const authService = new AuthService();