import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../database/connection';
import { logger } from '../utils/logger';

export interface SecurityEvent {
  id?: string;
  event_type: 'login' | 'logout' | 'login_failed' | 'mfa_enabled' | 'mfa_disabled' | 
             'password_changed' | 'account_locked' | 'permission_granted' | 
             'permission_revoked' | 'suspicious_activity' | 'rate_limit_exceeded' | 
             'security_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: number;
  session_id?: string;
  ip_address: string;
  user_agent?: string;
  resource?: string;
  action?: string;
  outcome: 'success' | 'failure' | 'error';
  metadata?: Record<string, any>;
  error_message?: string;
  created_at?: Date;
}

export interface SecurityEventQuery {
  event_type?: string;
  severity?: string;
  user_id?: number;
  ip_address?: string;
  outcome?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

export interface SecurityMetrics {
  total_events: number;
  events_by_type: Record<string, number>;
  events_by_severity: Record<string, number>;
  failed_logins: number;
  successful_logins: number;
  locked_accounts: number;
  suspicious_activities: number;
  top_source_ips: Array<{ ip_address: string; count: number }>;
  recent_events: SecurityEvent[];
}

class SecurityEventService {
  /**
   * Log a security event
   */
  async logEvent(event: SecurityEvent): Promise<string> {
    try {
      const eventId = uuidv4();
      
      await getPool().execute(
        `INSERT INTO security_events 
         (id, event_type, severity, user_id, session_id, ip_address, user_agent, 
          resource, action, outcome, metadata, error_message) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventId,
          event.event_type,
          event.severity,
          event.user_id || null,
          event.session_id || null,
          event.ip_address,
          event.user_agent || null,
          event.resource || null,
          event.action || null,
          event.outcome,
          event.metadata ? JSON.stringify(event.metadata) : null,
          event.error_message || null
        ]
      );

      // Log critical events to application logger as well
      if (event.severity === 'critical') {
        logger.error(`CRITICAL SECURITY EVENT: ${event.event_type}`, {
          eventId,
          userId: event.user_id,
          ipAddress: event.ip_address,
          metadata: event.metadata
        });
      }

      return eventId;
    } catch (error) {
      logger.error('Failed to log security event:', error);
      throw error;
    }
  }

  /**
   * Get security events with filtering
   */
  async getEvents(query: SecurityEventQuery = {}): Promise<SecurityEvent[]> {
    try {
      let sql = 'SELECT * FROM security_events WHERE 1=1';
      const params: any[] = [];

      // Build WHERE clause
      if (query.event_type) {
        sql += ' AND event_type = ?';
        params.push(query.event_type);
      }

      if (query.severity) {
        sql += ' AND severity = ?';
        params.push(query.severity);
      }

      if (query.user_id) {
        sql += ' AND user_id = ?';
        params.push(query.user_id);
      }

      if (query.ip_address) {
        sql += ' AND ip_address = ?';
        params.push(query.ip_address);
      }

      if (query.outcome) {
        sql += ' AND outcome = ?';
        params.push(query.outcome);
      }

      if (query.start_date) {
        sql += ' AND created_at >= ?';
        params.push(query.start_date);
      }

      if (query.end_date) {
        sql += ' AND created_at <= ?';
        params.push(query.end_date);
      }

      // Order by most recent first
      sql += ' ORDER BY created_at DESC';

      // Add pagination
      if (query.limit) {
        sql += ' LIMIT ?';
        params.push(query.limit);

        if (query.offset) {
          sql += ' OFFSET ?';
          params.push(query.offset);
        }
      }

      const [events] = await getPool().execute(sql, params) as any[];
      
      return events.map((event: any) => ({
        ...event,
        metadata: event.metadata ? JSON.parse(event.metadata) : null
      }));

    } catch (error) {
      logger.error('Failed to get security events:', error);
      throw error;
    }
  }

  /**
   * Get security metrics for dashboard
   */
  async getSecurityMetrics(timeRange: { start: Date; end: Date }): Promise<SecurityMetrics> {
    try {
      // Total events in time range
      const [totalResult] = await getPool().execute(
        'SELECT COUNT(*) as total FROM security_events WHERE created_at BETWEEN ? AND ?',
        [timeRange.start, timeRange.end]
      ) as any[];
      const total_events = totalResult[0].total;

      // Events by type
      const [typeResults] = await getPool().execute(
        `SELECT event_type, COUNT(*) as count 
         FROM security_events 
         WHERE created_at BETWEEN ? AND ? 
         GROUP BY event_type`,
        [timeRange.start, timeRange.end]
      ) as any[];
      const events_by_type = typeResults.reduce((acc: any, row: any) => {
        acc[row.event_type] = row.count;
        return acc;
      }, {});

      // Events by severity
      const [severityResults] = await getPool().execute(
        `SELECT severity, COUNT(*) as count 
         FROM security_events 
         WHERE created_at BETWEEN ? AND ? 
         GROUP BY severity`,
        [timeRange.start, timeRange.end]
      ) as any[];
      const events_by_severity = severityResults.reduce((acc: any, row: any) => {
        acc[row.severity] = row.count;
        return acc;
      }, {});

      // Failed logins
      const [failedLoginsResult] = await getPool().execute(
        `SELECT COUNT(*) as count 
         FROM security_events 
         WHERE event_type = 'login_failed' AND created_at BETWEEN ? AND ?`,
        [timeRange.start, timeRange.end]
      ) as any[];
      const failed_logins = failedLoginsResult[0].count;

      // Successful logins
      const [successfulLoginsResult] = await getPool().execute(
        `SELECT COUNT(*) as count 
         FROM security_events 
         WHERE event_type = 'login' AND outcome = 'success' AND created_at BETWEEN ? AND ?`,
        [timeRange.start, timeRange.end]
      ) as any[];
      const successful_logins = successfulLoginsResult[0].count;

      // Locked accounts
      const [lockedAccountsResult] = await getPool().execute(
        `SELECT COUNT(*) as count 
         FROM security_events 
         WHERE event_type = 'account_locked' AND created_at BETWEEN ? AND ?`,
        [timeRange.start, timeRange.end]
      ) as any[];
      const locked_accounts = lockedAccountsResult[0].count;

      // Suspicious activities
      const [suspiciousResult] = await getPool().execute(
        `SELECT COUNT(*) as count 
         FROM security_events 
         WHERE event_type = 'suspicious_activity' AND created_at BETWEEN ? AND ?`,
        [timeRange.start, timeRange.end]
      ) as any[];
      const suspicious_activities = suspiciousResult[0].count;

      // Top source IPs
      const [topIpsResult] = await getPool().execute(
        `SELECT ip_address, COUNT(*) as count 
         FROM security_events 
         WHERE created_at BETWEEN ? AND ? 
         GROUP BY ip_address 
         ORDER BY count DESC 
         LIMIT 10`,
        [timeRange.start, timeRange.end]
      ) as any[];
      const top_source_ips = topIpsResult;

      // Recent events
      const recent_events = await this.getEvents({
        start_date: timeRange.start,
        end_date: timeRange.end,
        limit: 20
      });

      return {
        total_events,
        events_by_type,
        events_by_severity,
        failed_logins,
        successful_logins,
        locked_accounts,
        suspicious_activities,
        top_source_ips,
        recent_events
      };

    } catch (error) {
      logger.error('Failed to get security metrics:', error);
      throw error;
    }
  }

  /**
   * Get events for a specific user
   */
  async getUserEvents(userId: number, limit: number = 50): Promise<SecurityEvent[]> {
    return this.getEvents({
      user_id: userId,
      limit
    });
  }

  /**
   * Get events from a specific IP address
   */
  async getIPEvents(ipAddress: string, limit: number = 50): Promise<SecurityEvent[]> {
    return this.getEvents({
      ip_address: ipAddress,
      limit
    });
  }

  /**
   * Get critical security events
   */
  async getCriticalEvents(limit: number = 100): Promise<SecurityEvent[]> {
    return this.getEvents({
      severity: 'critical',
      limit
    });
  }

  /**
   * Get failed login attempts for monitoring
   */
  async getFailedLoginAttempts(timeRange: { start: Date; end: Date }): Promise<SecurityEvent[]> {
    return this.getEvents({
      event_type: 'login_failed',
      start_date: timeRange.start,
      end_date: timeRange.end
    });
  }

  /**
   * Check for suspicious activity patterns
   */
  async detectSuspiciousActivity(): Promise<{
    rapid_failed_logins: Array<{ ip_address: string; count: number; latest: Date }>;
    multiple_user_attempts: Array<{ ip_address: string; user_count: number; latest: Date }>;
    unusual_login_times: SecurityEvent[];
  }> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Rapid failed logins from same IP
      const [rapidFailedLogins] = await getPool().execute(
        `SELECT ip_address, COUNT(*) as count, MAX(created_at) as latest
         FROM security_events 
         WHERE event_type = 'login_failed' 
         AND created_at >= ? 
         GROUP BY ip_address 
         HAVING count >= 5 
         ORDER BY count DESC`,
        [oneHourAgo]
      ) as any[];

      // Multiple user login attempts from same IP
      const [multipleUserAttempts] = await getPool().execute(
        `SELECT ip_address, COUNT(DISTINCT user_id) as user_count, MAX(created_at) as latest
         FROM security_events 
         WHERE event_type IN ('login', 'login_failed') 
         AND created_at >= ? 
         AND user_id IS NOT NULL
         GROUP BY ip_address 
         HAVING user_count >= 3 
         ORDER BY user_count DESC`,
        [oneHourAgo]
      ) as any[];

      // Unusual login times (outside business hours)
      const [unusualLogins] = await getPool().execute(
        `SELECT * FROM security_events 
         WHERE event_type = 'login' 
         AND outcome = 'success'
         AND created_at >= ? 
         AND (HOUR(created_at) < 6 OR HOUR(created_at) > 22)
         ORDER BY created_at DESC`,
        [oneHourAgo]
      ) as any[];

      return {
        rapid_failed_logins: rapidFailedLogins,
        multiple_user_attempts: multipleUserAttempts,
        unusual_login_times: unusualLogins.map((event: any) => ({
          ...event,
          metadata: event.metadata ? JSON.parse(event.metadata) : null
        }))
      };

    } catch (error) {
      logger.error('Failed to detect suspicious activity:', error);
      throw error;
    }
  }

  /**
   * Clean up old security events (for maintenance)
   */
  async cleanupOldEvents(retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      const [result] = await getPool().execute(
        'DELETE FROM security_events WHERE created_at < ?',
        [cutoffDate]
      ) as any;

      const deletedCount = result.affectedRows || 0;
      
      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old security events older than ${retentionDays} days`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old security events:', error);
      throw error;
    }
  }
}

export const securityEventService = new SecurityEventService();