import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/connection';
import { logger } from '../utils/logger';
import { securityEventService } from './securityEventService';

export interface RateLimitConfig {
  key: string; // endpoint, user, IP, etc.
  identifier: string; // specific identifier (IP address, user ID, etc.)
  windowSize: number; // in seconds
  maxRequests: number;
  blockDuration?: number; // in seconds
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  blocked?: boolean;
}

export interface RateLimitMetrics {
  total_requests: number;
  blocked_requests: number;
  top_blocked_ips: Array<{ identifier: string; blocked_count: number }>;
  endpoint_stats: Array<{ endpoint: string; requests: number; blocks: number }>;
}

class RateLimitService {
  /**
   * Check if request is within rate limit
   */
  async checkRateLimit(
    key: string, 
    identifier: string, 
    maxRequests: number = 100, 
    windowSize: number = 3600 // 1 hour default
  ): Promise<RateLimitResult> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - (windowSize * 1000));

      // Get or create rate limit record
      let rateLimitRecord = await this.getRateLimitRecord(key, identifier);
      
      if (!rateLimitRecord) {
        // Create new record
        rateLimitRecord = await this.createRateLimitRecord({
          key,
          identifier,
          windowSize,
          maxRequests
        });
      }

      // Check if currently blocked
      if (rateLimitRecord.is_blocked && rateLimitRecord.blocked_until && 
          new Date() < rateLimitRecord.blocked_until) {
        
        const retryAfter = Math.ceil(
          (rateLimitRecord.blocked_until.getTime() - now.getTime()) / 1000
        );

        return {
          allowed: false,
          limit: maxRequests,
          remaining: 0,
          resetTime: rateLimitRecord.blocked_until,
          retryAfter,
          blocked: true
        };
      }

      // Check if we need to reset the window
      const windowStartTime = new Date(rateLimitRecord.window_start);
      if (now.getTime() - windowStartTime.getTime() >= (windowSize * 1000)) {
        // Reset window
        await this.resetRateLimitWindow(rateLimitRecord.id, now, maxRequests);
        rateLimitRecord.requests_count = 0;
        rateLimitRecord.window_start = now;
        rateLimitRecord.max_requests = maxRequests;
      }

      // Check if limit exceeded
      if (rateLimitRecord.requests_count >= rateLimitRecord.max_requests) {
        // Block the identifier
        const blockDuration = this.calculateBlockDuration(rateLimitRecord.requests_count);
        const blockedUntil = new Date(now.getTime() + (blockDuration * 1000));
        
        await this.blockIdentifier(rateLimitRecord.id, blockedUntil);

        // Log security event
        await securityEventService.logEvent({
          event_type: 'rate_limit_exceeded',
          severity: 'medium',
          ip_address: identifier.includes('.') ? identifier : '127.0.0.1',
          resource: key,
          action: 'rate_limit_check',
          outcome: 'failure',
          metadata: {
            identifier,
            requests_count: rateLimitRecord.requests_count,
            max_requests: rateLimitRecord.max_requests,
            window_size: windowSize,
            block_duration: blockDuration
          }
        });

        return {
          allowed: false,
          limit: rateLimitRecord.max_requests,
          remaining: 0,
          resetTime: blockedUntil,
          retryAfter: blockDuration,
          blocked: true
        };
      }

      // Allow request
      const remaining = rateLimitRecord.max_requests - rateLimitRecord.requests_count - 1;
      const resetTime = new Date(windowStartTime.getTime() + (windowSize * 1000));

      return {
        allowed: true,
        limit: rateLimitRecord.max_requests,
        remaining: Math.max(0, remaining),
        resetTime
      };

    } catch (error) {
      logger.error('Rate limit check error:', error);
      // Fail open - allow request if there's an error
      return {
        allowed: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetTime: new Date(Date.now() + (windowSize * 1000))
      };
    }
  }

  /**
   * Increment request counter
   */
  async incrementCounter(key: string, identifier: string): Promise<void> {
    try {
      await db.execute(
        `UPDATE rate_limits 
         SET requests_count = requests_count + 1, updated_at = NOW() 
         WHERE identifier = ? AND endpoint = ?`,
        [identifier, key]
      );
    } catch (error) {
      logger.error('Increment counter error:', error);
    }
  }

  /**
   * Reset counter for identifier
   */
  async resetCounter(key: string, identifier: string): Promise<void> {
    try {
      await db.execute(
        `UPDATE rate_limits 
         SET requests_count = 0, is_blocked = FALSE, blocked_until = NULL, updated_at = NOW() 
         WHERE identifier = ? AND endpoint = ?`,
        [identifier, key]
      );
    } catch (error) {
      logger.error('Reset counter error:', error);
    }
  }

  /**
   * Get rate limit metrics
   */
  async getRateLimitMetrics(timeRange: { start: Date; end: Date }): Promise<RateLimitMetrics> {
    try {
      // Total requests (approximate from rate limit records)
      const [totalResult] = await db.execute(
        'SELECT SUM(requests_count) as total FROM rate_limits WHERE updated_at BETWEEN ? AND ?',
        [timeRange.start, timeRange.end]
      ) as any[];
      const total_requests = totalResult[0].total || 0;

      // Blocked requests from security events
      const [blockedResult] = await db.execute(
        `SELECT COUNT(*) as total FROM security_events 
         WHERE event_type = 'rate_limit_exceeded' 
         AND created_at BETWEEN ? AND ?`,
        [timeRange.start, timeRange.end]
      ) as any[];
      const blocked_requests = blockedResult[0].total || 0;

      // Top blocked IPs
      const [topBlockedIPs] = await db.execute(
        `SELECT JSON_EXTRACT(metadata, '$.identifier') as identifier, COUNT(*) as blocked_count
         FROM security_events 
         WHERE event_type = 'rate_limit_exceeded' 
         AND created_at BETWEEN ? AND ?
         GROUP BY JSON_EXTRACT(metadata, '$.identifier')
         ORDER BY blocked_count DESC 
         LIMIT 10`,
        [timeRange.start, timeRange.end]
      ) as any[];

      // Endpoint stats
      const [endpointStats] = await db.execute(
        `SELECT endpoint, SUM(requests_count) as requests, 
                COUNT(CASE WHEN is_blocked = TRUE THEN 1 END) as blocks
         FROM rate_limits 
         WHERE updated_at BETWEEN ? AND ?
         GROUP BY endpoint 
         ORDER BY requests DESC`,
        [timeRange.start, timeRange.end]
      ) as any[];

      return {
        total_requests,
        blocked_requests,
        top_blocked_ips: topBlockedIPs.map((row: any) => ({
          identifier: row.identifier?.replace(/"/g, '') || 'unknown',
          blocked_count: row.blocked_count
        })),
        endpoint_stats: endpointStats
      };

    } catch (error) {
      logger.error('Get rate limit metrics error:', error);
      return {
        total_requests: 0,
        blocked_requests: 0,
        top_blocked_ips: [],
        endpoint_stats: []
      };
    }
  }

  /**
   * Get top blocked IPs
   */
  async getTopBlockedIPs(limit: number = 10): Promise<Array<{ identifier: string; count: number; last_blocked: Date }>> {
    try {
      const [results] = await db.execute(
        `SELECT identifier, COUNT(*) as count, MAX(updated_at) as last_blocked
         FROM rate_limits 
         WHERE is_blocked = TRUE 
         GROUP BY identifier 
         ORDER BY count DESC 
         LIMIT ?`,
        [limit]
      ) as any[];

      return results;
    } catch (error) {
      logger.error('Get top blocked IPs error:', error);
      return [];
    }
  }

  /**
   * Enable emergency mode (stricter limits)
   */
  async enableEmergencyMode(duration: number = 3600): Promise<void> {
    try {
      const emergencyLimits = {
        maxRequests: 10, // Very strict
        windowSize: 300   // 5 minutes
      };

      // Update all existing rate limits to emergency mode
      await db.execute(
        `UPDATE rate_limits 
         SET max_requests = ?, window_size = ?, updated_at = NOW() 
         WHERE is_blocked = FALSE`,
        [emergencyLimits.maxRequests, emergencyLimits.windowSize]
      );

      // Log emergency mode activation
      await securityEventService.logEvent({
        event_type: 'security_violation',
        severity: 'critical',
        ip_address: '127.0.0.1',
        resource: 'rate_limits',
        action: 'emergency_mode_enabled',
        outcome: 'success',
        metadata: {
          duration,
          emergency_limits: emergencyLimits
        }
      });

      logger.warn(`Emergency rate limiting mode enabled for ${duration} seconds`);

      // Schedule automatic disable (in a real system, use a job queue)
      setTimeout(async () => {
        await this.disableEmergencyMode();
      }, duration * 1000);

    } catch (error) {
      logger.error('Enable emergency mode error:', error);
      throw error;
    }
  }

  /**
   * Disable emergency mode
   */
  async disableEmergencyMode(): Promise<void> {
    try {
      // Reset to normal limits (this is simplified - in reality you'd restore previous limits)
      await db.execute(
        `UPDATE rate_limits 
         SET max_requests = 100, window_size = 3600, updated_at = NOW()`
      );

      await securityEventService.logEvent({
        event_type: 'security_violation',
        severity: 'medium',
        ip_address: '127.0.0.1',
        resource: 'rate_limits',
        action: 'emergency_mode_disabled',
        outcome: 'success'
      });

      logger.info('Emergency rate limiting mode disabled');
    } catch (error) {
      logger.error('Disable emergency mode error:', error);
    }
  }

  /**
   * Clean up old rate limit records
   */
  async cleanupOldRecords(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
      
      const [result] = await db.execute(
        'DELETE FROM rate_limits WHERE updated_at < ? AND is_blocked = FALSE',
        [cutoffDate]
      ) as any;

      const deletedCount = result.affectedRows || 0;
      
      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old rate limit records`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('Cleanup old records error:', error);
      return 0;
    }
  }

  // Private helper methods

  private async getRateLimitRecord(key: string, identifier: string): Promise<any> {
    try {
      const [records] = await db.execute(
        'SELECT * FROM rate_limits WHERE identifier = ? AND endpoint = ?',
        [identifier, key]
      ) as any[];

      return records.length > 0 ? records[0] : null;
    } catch (error) {
      logger.error('Get rate limit record error:', error);
      return null;
    }
  }

  private async createRateLimitRecord(config: RateLimitConfig): Promise<any> {
    try {
      const id = uuidv4();
      const now = new Date();

      await db.execute(
        `INSERT INTO rate_limits 
         (id, identifier, endpoint, requests_count, window_start, window_size, max_requests, is_blocked) 
         VALUES (?, ?, ?, 0, ?, ?, ?, FALSE)`,
        [id, config.identifier, config.key, now, config.windowSize, config.maxRequests]
      );

      return {
        id,
        identifier: config.identifier,
        endpoint: config.key,
        requests_count: 0,
        window_start: now,
        window_size: config.windowSize,
        max_requests: config.maxRequests,
        is_blocked: false,
        blocked_until: null
      };
    } catch (error) {
      logger.error('Create rate limit record error:', error);
      throw error;
    }
  }

  private async resetRateLimitWindow(
    recordId: string, 
    newWindowStart: Date, 
    maxRequests: number
  ): Promise<void> {
    try {
      await db.execute(
        `UPDATE rate_limits 
         SET requests_count = 0, window_start = ?, max_requests = ?, 
             is_blocked = FALSE, blocked_until = NULL, updated_at = NOW() 
         WHERE id = ?`,
        [newWindowStart, maxRequests, recordId]
      );
    } catch (error) {
      logger.error('Reset rate limit window error:', error);
    }
  }

  private async blockIdentifier(recordId: string, blockedUntil: Date): Promise<void> {
    try {
      await db.execute(
        `UPDATE rate_limits 
         SET is_blocked = TRUE, blocked_until = ?, updated_at = NOW() 
         WHERE id = ?`,
        [blockedUntil, recordId]
      );
    } catch (error) {
      logger.error('Block identifier error:', error);
    }
  }

  private calculateBlockDuration(requestCount: number): number {
    // Progressive blocking: more requests = longer block
    if (requestCount < 150) return 300;    // 5 minutes
    if (requestCount < 200) return 900;    // 15 minutes
    if (requestCount < 300) return 1800;   // 30 minutes
    return 3600; // 1 hour
  }
}

export const rateLimitService = new RateLimitService();