import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { db } from '../database/connection';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export interface CallTrackingData {
  phoneNumber: string;
  callType: 'direct' | 'instagram' | 'whatsapp';
  callSource: string;
  sessionId: string;
  ipAddress: string;
  userAgent?: string;
  country?: string;
  city?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  pageUrl: string;
  referrer?: string;
  callData?: any;
}

export interface CallStats {
  totalCalls: number;
  callsByType: Record<string, number>;
  callsBySource: Record<string, number>;
  callsByDevice: Record<string, number>;
  recentCalls: number;
  topCountries: Array<{ country: string; count: number }>;
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
}

export class CallTrackingService {
  /**
   * Track a phone call attempt
   */
  async trackCall(callData: CallTrackingData): Promise<{ success: boolean; callId?: number }> {
    try {
      const query = `
        INSERT INTO call_tracking (
          phone_number, call_type, call_source, session_id, ip_address,
          user_agent, country, city, device_type, browser, os,
          page_url, referrer, call_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        callData.phoneNumber,
        callData.callType,
        callData.callSource,
        callData.sessionId,
        callData.ipAddress,
        callData.userAgent || null,
        callData.country || null,
        callData.city || null,
        callData.deviceType || null,
        callData.browser || null,
        callData.os || null,
        callData.pageUrl,
        callData.referrer || null,
        callData.callData ? JSON.stringify(callData.callData) : null
      ];

      const [result] = await db.execute<ResultSetHeader>(query, values);

      logger.info('Call tracked successfully', {
        callId: result.insertId,
        phoneNumber: callData.phoneNumber,
        callType: callData.callType,
        callSource: callData.callSource,
        ipAddress: callData.ipAddress
      });

      return {
        success: true,
        callId: result.insertId
      };
    } catch (error) {
      logger.error('Failed to track call:', error);
      throw new AppError('Failed to track call', 500);
    }
  }

  /**
   * Get call statistics
   */
  async getCallStats(): Promise<CallStats> {
    try {
      // Get total calls
      const [totalResult] = await db.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM call_tracking'
      );
      const totalCalls = totalResult[0].total;

      // Get calls by type
      const [typeResult] = await db.execute<RowDataPacket[]>(
        'SELECT call_type, COUNT(*) as count FROM call_tracking GROUP BY call_type'
      );
      const callsByType = typeResult.reduce((acc, row) => {
        acc[row.call_type] = row.count;
        return acc;
      }, {} as Record<string, number>);

      // Get calls by source
      const [sourceResult] = await db.execute<RowDataPacket[]>(
        'SELECT call_source, COUNT(*) as count FROM call_tracking GROUP BY call_source'
      );
      const callsBySource = sourceResult.reduce((acc, row) => {
        acc[row.call_source] = row.count;
        return acc;
      }, {} as Record<string, number>);
      // Get calls by device
      const [deviceResult] = await db.execute<RowDataPacket[]>(
        'SELECT device_type, COUNT(*) as count FROM call_tracking WHERE device_type IS NOT NULL GROUP BY device_type'
      );
      const callsByDevice = deviceResult.reduce((acc, row) => {
        acc[row.device_type] = row.count;
        return acc;
      }, {} as Record<string, number>);

      // Get recent calls (last 24 hours)
      const [recentResult] = await db.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM call_tracking WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
      );
      const recentCalls = recentResult[0].count;

      // Get top countries
      const [countryResult] = await db.execute<RowDataPacket[]>(
        'SELECT country, COUNT(*) as count FROM call_tracking WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 5'
      );
      const topCountries = countryResult.map(row => ({
        country: row.country,
        count: row.count
      }));

      // Get calls today
      const [todayResult] = await db.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM call_tracking WHERE DATE(created_at) = CURDATE()'
      );
      const callsToday = todayResult[0].count;

      // Get calls this week
      const [weekResult] = await db.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM call_tracking WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
      );
      const callsThisWeek = weekResult[0].count;

      // Get calls this month
      const [monthResult] = await db.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM call_tracking WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );
      const callsThisMonth = monthResult[0].count;

      return {
        totalCalls,
        callsByType,
        callsBySource,
        callsByDevice,
        recentCalls,
        topCountries,
        callsToday,
        callsThisWeek,
        callsThisMonth
      };
    } catch (error) {
      logger.error('Failed to get call stats:', error);
      throw new AppError('Failed to get call statistics', 500);
    }
  }

  /**
   * Get recent calls with pagination
   */
  async getRecentCalls(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const query = `
        SELECT 
          id, phone_number, call_type, call_source, session_id,
          ip_address, country, city, device_type, browser, os,
          page_url, referrer, created_at
        FROM call_tracking 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;

      const [result] = await db.execute<RowDataPacket[]>(query, [limit, offset]);
      return result;
    } catch (error) {
      logger.error('Failed to get recent calls:', error);
      throw new AppError('Failed to get recent calls', 500);
    }
  }
}

export const callTrackingService = new CallTrackingService();