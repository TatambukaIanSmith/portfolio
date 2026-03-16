import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { authorizationService } from '../services/authorizationService';
import { securityEventService } from '../services/securityEventService';
import { logger } from '../utils/logger';

export class AuthController {
  /**
   * User login
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Missing credentials',
          message: 'Email and password are required'
        });
      }

      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceFingerprint: req.get('X-Device-Fingerprint')
      };

      const authResult = await authService.authenticate(email, password, metadata);

      if (!authResult.success) {
        return res.status(401).json({
          success: false,
          error: authResult.error,
          message: authResult.error,
          lockoutTime: authResult.lockoutTime
        });
      }

      // If MFA is required
      if (authResult.requiresMFA) {
        return res.status(200).json({
          success: true,
          requiresMFA: true,
          message: 'MFA verification required',
          userId: authResult.user?.id
        });
      }

      // Successful login
      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: authResult.user?.id,
          email: authResult.user?.email,
          firstName: authResult.user?.first_name,
          lastName: authResult.user?.last_name,
          role: authResult.user?.role,
          status: authResult.user?.status
        },
        token: authResult.token,
        refreshToken: authResult.refreshToken
      });

    } catch (error) {
      logger.error('Login error:', error);
      
      await securityEventService.logEvent({
        event_type: 'security_violation',
        severity: 'high',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        resource: 'auth',
        action: 'login',
        outcome: 'error',
        error_message: 'Login controller error'
      });

      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: 'An error occurred during login'
      });
    }
  }

  /**
   * Verify MFA token
   */
  async verifyMFA(req: Request, res: Response) {
    try {
      const { userId, token } = req.body;
      
      if (!userId || !token) {
        return res.status(400).json({
          success: false,
          error: 'Missing MFA data',
          message: 'User ID and MFA token are required'
        });
      }

      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceFingerprint: req.get('X-Device-Fingerprint')
      };

      const authResult = await authService.verifyMFA(userId, token, metadata);

      if (!authResult.success) {
        return res.status(401).json({
          success: false,
          error: authResult.error,
          message: authResult.error
        });
      }

      res.status(200).json({
        success: true,
        message: 'MFA verification successful',
        user: {
          id: authResult.user?.id,
          email: authResult.user?.email,
          firstName: authResult.user?.first_name,
          lastName: authResult.user?.last_name,
          role: authResult.user?.role,
          status: authResult.user?.status
        },
        token: authResult.token,
        refreshToken: authResult.refreshToken
      });

    } catch (error) {
      logger.error('MFA verification error:', error);
      
      res.status(500).json({
        success: false,
        error: 'MFA verification failed',
        message: 'An error occurred during MFA verification'
      });
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Missing refresh token',
          message: 'Refresh token is required'
        });
      }

      const tokenPair = await authService.refreshToken(refreshToken);

      if (!tokenPair) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          message: 'Refresh token is invalid or expired'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        token: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Token refresh failed',
        message: 'An error occurred during token refresh'
      });
    }
  }

  /**
   * User logout
   */
  async logout(req: Request, res: Response) {
    try {
      const user = req.user;
      
      if (user && user.sessionId) {
        await authService.revokeSession(user.sessionId, 'user_logout');
        
        await securityEventService.logEvent({
          event_type: 'logout',
          severity: 'low',
          user_id: user.id,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          outcome: 'success'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
          message: 'Please login to view profile'
        });
      }

      // Get user roles
      const roles = await authorizationService.getUserRoles(user.id);

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.status,
          mfaEnabled: user.mfa_enabled,
          lastLogin: user.last_login,
          createdAt: user.created_at,
          roles: roles.map(role => ({
            id: role.id,
            name: role.name,
            description: role.description
          }))
        }
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Profile fetch failed',
        message: 'An error occurred while fetching profile'
      });
    }
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(req: Request, res: Response) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
          message: 'Please login to enable MFA'
        });
      }

      const mfaSetup = await authService.enableMFA(user.id);

      res.status(200).json({
        success: true,
        message: 'MFA setup initiated',
        mfa: {
          secret: mfaSetup.secret,
          qrCodeUrl: mfaSetup.qrCodeUrl,
          backupCodes: mfaSetup.backupCodes
        }
      });

    } catch (error) {
      logger.error('Enable MFA error:', error);
      
      res.status(500).json({
        success: false,
        error: 'MFA setup failed',
        message: 'An error occurred while setting up MFA'
      });
    }
  }

  /**
   * Confirm MFA setup
   */
  async confirmMFA(req: Request, res: Response) {
    try {
      const user = req.user;
      const { token } = req.body;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
          message: 'Please login to confirm MFA'
        });
      }

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Missing MFA token',
          message: 'MFA token is required'
        });
      }

      const confirmed = await authService.confirmMFA(user.id, token);

      if (!confirmed) {
        return res.status(400).json({
          success: false,
          error: 'Invalid MFA token',
          message: 'The provided MFA token is invalid'
        });
      }

      res.status(200).json({
        success: true,
        message: 'MFA enabled successfully'
      });

    } catch (error) {
      logger.error('Confirm MFA error:', error);
      
      res.status(500).json({
        success: false,
        error: 'MFA confirmation failed',
        message: 'An error occurred while confirming MFA'
      });
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(req: Request, res: Response) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
          message: 'Please login to disable MFA'
        });
      }

      const disabled = await authService.disableMFA(user.id);

      if (!disabled) {
        return res.status(500).json({
          success: false,
          error: 'MFA disable failed',
          message: 'Failed to disable MFA'
        });
      }

      res.status(200).json({
        success: true,
        message: 'MFA disabled successfully'
      });

    } catch (error) {
      logger.error('Disable MFA error:', error);
      
      res.status(500).json({
        success: false,
        error: 'MFA disable failed',
        message: 'An error occurred while disabling MFA'
      });
    }
  }
}

export const authController = new AuthController();