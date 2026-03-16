import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/connection';
import { logger } from '../utils/logger';
import { securityEventService } from './securityEventService';

export interface Role {
  id: string;
  name: string;
  description?: string;
  is_system_role: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
  created_at: Date;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  conditions?: Record<string, any>;
  created_at: Date;
}

export interface UserRole {
  id: string;
  user_id: number;
  role_id: string;
  assigned_by?: number;
  assigned_at: Date;
  expires_at?: Date;
  is_active: boolean;
}

export interface AccessRequest {
  userId: number;
  resource: string;
  action: string;
  context?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  matchedRoles: string[];
  matchedPermissions: string[];
  conditions?: Record<string, any>;
}

class AuthorizationService {
  /**
   * Check if user has permission to perform action on resource
   */
  async checkPermission(
    userId: number, 
    resource: string, 
    action: string, 
    context?: Record<string, any>
  ): Promise<boolean> {
    try {
      const decision = await this.evaluateAccess({
        userId,
        resource,
        action,
        context,
        ipAddress: '127.0.0.1' // Internal check
      });

      return decision.allowed;
    } catch (error) {
      logger.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Evaluate access request and return detailed decision
   */
  async evaluateAccess(request: AccessRequest): Promise<AccessDecision> {
    try {
      // Get user's active roles
      const userRoles = await this.getUserRoles(request.userId);
      
      if (userRoles.length === 0) {
        await this.logAccessAttempt(request, {
          allowed: false,
          reason: 'No roles assigned',
          matchedRoles: [],
          matchedPermissions: []
        });
        
        return {
          allowed: false,
          reason: 'No roles assigned to user',
          matchedRoles: [],
          matchedPermissions: []
        };
      }

      // Check permissions for each role
      const matchedRoles: string[] = [];
      const matchedPermissions: string[] = [];
      let hasPermission = false;

      for (const role of userRoles) {
        const rolePermissions = await this.getRolePermissions(role.id);
        
        for (const permission of rolePermissions) {
          if (permission.resource === request.resource && 
              permission.action === request.action) {
            
            matchedRoles.push(role.name);
            matchedPermissions.push(`${permission.resource}:${permission.action}`);
            
            // Check conditions if any
            if (permission.conditions) {
              const conditionsMet = this.evaluateConditions(
                permission.conditions, 
                request.context || {}
              );
              if (conditionsMet) {
                hasPermission = true;
              }
            } else {
              hasPermission = true;
            }
          }
        }
      }

      const decision: AccessDecision = {
        allowed: hasPermission,
        reason: hasPermission ? 'Permission granted' : 'Permission denied',
        matchedRoles,
        matchedPermissions
      };

      await this.logAccessAttempt(request, decision);
      
      return decision;

    } catch (error) {
      logger.error('Access evaluation error:', error);
      
      const decision: AccessDecision = {
        allowed: false,
        reason: 'Access evaluation failed',
        matchedRoles: [],
        matchedPermissions: []
      };

      await this.logAccessAttempt(request, decision);
      return decision;
    }
  }

  /**
   * Get user's active roles
   */
  async getUserRoles(userId: number): Promise<Role[]> {
    try {
      const [roles] = await db.execute(
        `SELECT r.* FROM roles r
         JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = ? 
         AND ur.is_active = TRUE 
         AND r.is_active = TRUE
         AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`,
        [userId]
      ) as any[];

      return roles;
    } catch (error) {
      logger.error('Get user roles error:', error);
      return [];
    }
  }

  /**
   * Get permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<(Permission & { conditions?: Record<string, any> })[]> {
    try {
      const [permissions] = await db.execute(
        `SELECT p.*, rp.conditions FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role_id = ?`,
        [roleId]
      ) as any[];

      return permissions.map((perm: any) => ({
        ...perm,
        conditions: perm.conditions ? JSON.parse(perm.conditions) : null
      }));
    } catch (error) {
      logger.error('Get role permissions error:', error);
      return [];
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: number, 
    roleId: string, 
    assignedBy?: number, 
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      // Check if role exists and is active
      const [roles] = await db.execute(
        'SELECT * FROM roles WHERE id = ? AND is_active = TRUE',
        [roleId]
      ) as any[];

      if (roles.length === 0) {
        throw new Error('Role not found or inactive');
      }

      const role = roles[0];

      // Check if user already has this role
      const [existingRoles] = await db.execute(
        'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ? AND is_active = TRUE',
        [userId, roleId]
      ) as any[];

      if (existingRoles.length > 0) {
        throw new Error('User already has this role');
      }

      // Assign role
      const userRoleId = uuidv4();
      await db.execute(
        `INSERT INTO user_roles 
         (id, user_id, role_id, assigned_by, expires_at, is_active) 
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [userRoleId, userId, roleId, assignedBy || null, expiresAt || null]
      );

      // Log security event
      await securityEventService.logEvent({
        event_type: 'permission_granted',
        severity: 'medium',
        user_id: userId,
        ip_address: '127.0.0.1',
        resource: 'roles',
        action: 'assign',
        outcome: 'success',
        metadata: {
          role_id: roleId,
          role_name: role.name,
          assigned_by: assignedBy,
          expires_at: expiresAt?.toISOString()
        }
      });

      return true;
    } catch (error) {
      logger.error('Assign role error:', error);
      throw error;
    }
  }

  /**
   * Revoke role from user
   */
  async revokeRole(userId: number, roleId: string, revokedBy?: number): Promise<boolean> {
    try {
      // Get role info for logging
      const [roles] = await db.execute(
        'SELECT * FROM roles WHERE id = ?',
        [roleId]
      ) as any[];

      const role = roles[0];

      // Revoke role
      const [result] = await db.execute(
        'UPDATE user_roles SET is_active = FALSE WHERE user_id = ? AND role_id = ?',
        [userId, roleId]
      ) as any;

      if (result.affectedRows === 0) {
        throw new Error('Role assignment not found');
      }

      // Log security event
      await securityEventService.logEvent({
        event_type: 'permission_revoked',
        severity: 'medium',
        user_id: userId,
        ip_address: '127.0.0.1',
        resource: 'roles',
        action: 'revoke',
        outcome: 'success',
        metadata: {
          role_id: roleId,
          role_name: role?.name,
          revoked_by: revokedBy
        }
      });

      return true;
    } catch (error) {
      logger.error('Revoke role error:', error);
      throw error;
    }
  }

  /**
   * Create new role
   */
  async createRole(
    name: string, 
    description?: string, 
    isSystemRole: boolean = false
  ): Promise<Role> {
    try {
      // Check if role name already exists
      const [existingRoles] = await db.execute(
        'SELECT * FROM roles WHERE name = ?',
        [name]
      ) as any[];

      if (existingRoles.length > 0) {
        throw new Error('Role name already exists');
      }

      const roleId = uuidv4();
      await db.execute(
        `INSERT INTO roles (id, name, description, is_system_role, is_active) 
         VALUES (?, ?, ?, ?, TRUE)`,
        [roleId, name, description || null, isSystemRole]
      );

      // Get created role
      const [roles] = await db.execute(
        'SELECT * FROM roles WHERE id = ?',
        [roleId]
      ) as any[];

      return roles[0];
    } catch (error) {
      logger.error('Create role error:', error);
      throw error;
    }
  }

  /**
   * Create new permission
   */
  async createPermission(
    resource: string, 
    action: string, 
    description?: string
  ): Promise<Permission> {
    try {
      // Check if permission already exists
      const [existingPerms] = await db.execute(
        'SELECT * FROM permissions WHERE resource = ? AND action = ?',
        [resource, action]
      ) as any[];

      if (existingPerms.length > 0) {
        throw new Error('Permission already exists');
      }

      const permissionId = uuidv4();
      await db.execute(
        `INSERT INTO permissions (id, resource, action, description) 
         VALUES (?, ?, ?, ?)`,
        [permissionId, resource, action, description || null]
      );

      // Get created permission
      const [permissions] = await db.execute(
        'SELECT * FROM permissions WHERE id = ?',
        [permissionId]
      ) as any[];

      return permissions[0];
    } catch (error) {
      logger.error('Create permission error:', error);
      throw error;
    }
  }

  /**
   * Grant permission to role
   */
  async grantPermissionToRole(
    roleId: string, 
    permissionId: string, 
    conditions?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Check if already granted
      const [existing] = await db.execute(
        'SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?',
        [roleId, permissionId]
      ) as any[];

      if (existing.length > 0) {
        throw new Error('Permission already granted to role');
      }

      const rolePermissionId = uuidv4();
      await db.execute(
        `INSERT INTO role_permissions (id, role_id, permission_id, conditions) 
         VALUES (?, ?, ?, ?)`,
        [rolePermissionId, roleId, permissionId, conditions ? JSON.stringify(conditions) : null]
      );

      return true;
    } catch (error) {
      logger.error('Grant permission to role error:', error);
      throw error;
    }
  }

  /**
   * Revoke permission from role
   */
  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    try {
      const [result] = await db.execute(
        'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
        [roleId, permissionId]
      ) as any;

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Revoke permission from role error:', error);
      throw error;
    }
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      const [roles] = await db.execute(
        'SELECT * FROM roles ORDER BY name'
      ) as any[];

      return roles;
    } catch (error) {
      logger.error('Get all roles error:', error);
      return [];
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const [permissions] = await db.execute(
        'SELECT * FROM permissions ORDER BY resource, action'
      ) as any[];

      return permissions;
    } catch (error) {
      logger.error('Get all permissions error:', error);
      return [];
    }
  }

  /**
   * Generate access report for compliance
   */
  async generateAccessReport(timeRange: { start: Date; end: Date }): Promise<{
    total_access_attempts: number;
    successful_access: number;
    denied_access: number;
    top_resources: Array<{ resource: string; attempts: number }>;
    top_users: Array<{ user_id: number; attempts: number }>;
    permission_usage: Array<{ permission: string; usage_count: number }>;
  }> {
    try {
      // This would typically query an access_logs table
      // For now, we'll use security_events as a proxy
      const [totalAttempts] = await db.execute(
        `SELECT COUNT(*) as total FROM security_events 
         WHERE event_type IN ('permission_granted', 'permission_revoked') 
         AND created_at BETWEEN ? AND ?`,
        [timeRange.start, timeRange.end]
      ) as any[];

      const [successfulAccess] = await db.execute(
        `SELECT COUNT(*) as total FROM security_events 
         WHERE event_type = 'permission_granted' 
         AND outcome = 'success'
         AND created_at BETWEEN ? AND ?`,
        [timeRange.start, timeRange.end]
      ) as any[];

      const [deniedAccess] = await db.execute(
        `SELECT COUNT(*) as total FROM security_events 
         WHERE event_type = 'permission_revoked' 
         AND created_at BETWEEN ? AND ?`,
        [timeRange.start, timeRange.end]
      ) as any[];

      return {
        total_access_attempts: totalAttempts[0].total,
        successful_access: successfulAccess[0].total,
        denied_access: deniedAccess[0].total,
        top_resources: [],
        top_users: [],
        permission_usage: []
      };

    } catch (error) {
      logger.error('Generate access report error:', error);
      throw error;
    }
  }

  // Private helper methods

  private evaluateConditions(
    conditions: Record<string, any>, 
    context: Record<string, any>
  ): boolean {
    try {
      // Simple condition evaluation
      // In a real system, this would be more sophisticated
      for (const [key, expectedValue] of Object.entries(conditions)) {
        if (context[key] !== expectedValue) {
          return false;
        }
      }
      return true;
    } catch (error) {
      logger.error('Condition evaluation error:', error);
      return false;
    }
  }

  private async logAccessAttempt(
    request: AccessRequest, 
    decision: AccessDecision
  ): Promise<void> {
    try {
      await securityEventService.logEvent({
        event_type: decision.allowed ? 'permission_granted' : 'permission_revoked',
        severity: decision.allowed ? 'low' : 'medium',
        user_id: request.userId,
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
        resource: request.resource,
        action: request.action,
        outcome: decision.allowed ? 'success' : 'failure',
        metadata: {
          reason: decision.reason,
          matched_roles: decision.matchedRoles,
          matched_permissions: decision.matchedPermissions,
          context: request.context
        }
      });
    } catch (error) {
      logger.error('Log access attempt error:', error);
    }
  }
}

export const authorizationService = new AuthorizationService();