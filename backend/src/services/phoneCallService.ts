import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../database/connection';
import { logger } from '../utils/logger';
import { emailService } from './emailService';
import { CreatePhoneCallRequest, UpdatePhoneCallRequest, PhoneCallFilters } from '../validation/phoneCallValidation';

export interface PhoneCall {
  id: string;
  caller_name?: string;
  caller_email?: string;
  caller_phone?: string;
  call_type: 'direct' | 'callback_request' | 'instagram';
  message?: string;
  status: 'requested' | 'scheduled' | 'completed' | 'missed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  source: string;
  preferred_time?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
  timestamp: number;
  created_at: string;
  updated_at: string;
}

export interface PhoneCallStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  recentCount: number;
}

export class PhoneCallService {
  /**
   * Create a new phone call request
   */
  async createPhoneCall(
    data: CreatePhoneCallRequest,
    metadata: {
      userAgent?: string;
      ipAddress?: string;
      referrer?: string;
    } = {}
  ): Promise<PhoneCall> {
    const phoneCallId = uuidv4();
    const timestamp = Date.now();

    try {
      // Determine priority based on call type and message
      let priority: 'low' | 'medium' | 'high' = 'medium';
      
      if (data.call_type === 'callback_request') {
        priority = 'high'; // Callback requests are high priority
      } else if (data.message && data.message.toLowerCase().includes('urgent')) {
        priority = 'high';
      }

      // Insert phone call into database
      const [result] = await getPool().execute(
        `INSERT INTO phone_calls (
          id, caller_name, caller_email, caller_phone, call_type, message,
          status, priority, source, preferred_time, user_agent, ip_address,
          referrer, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          phoneCallId,
          data.caller_name || null,
          data.caller_email || null,
          data.caller_phone || null,
          data.call_type,
          data.message || null,
          'requested',
          priority,
          data.source,
          data.preferred_time || null,
          metadata.userAgent || null,
          metadata.ipAddress || null,
          metadata.referrer || null,
          timestamp,
        ]
      );

      logger.info('Phone call request created successfully', {
        phoneCallId,
        callType: data.call_type,
        priority,
      });

      // Get the created phone call
      const phoneCall = await this.getPhoneCallById(phoneCallId);
      if (!phoneCall) {
        throw new Error('Failed to retrieve created phone call');
      }

      // Send email notifications asynchronously
      this.sendPhoneCallNotifications(phoneCall).catch((error) => {
        logger.error('Failed to send phone call notifications:', error);
      });

      return phoneCall;
    } catch (error) {
      logger.error('Failed to create phone call request:', error);
      throw error;
    }
  }

  /**
   * Get phone call by ID
   */
  async getPhoneCallById(id: string): Promise<PhoneCall | null> {
    try {
      const [rows] = await getPool().execute(
        'SELECT * FROM phone_calls WHERE id = ?',
        [id]
      );

      const phoneCallRows = rows as any[];
      if (phoneCallRows.length === 0) {
        return null;
      }

      return this.formatPhoneCall(phoneCallRows[0]);
    } catch (error) {
      logger.error('Failed to get phone call by ID:', error);
      throw error;
    }
  }

  /**
   * Get phone calls with filtering and pagination
   */
  async getPhoneCalls(filters: PhoneCallFilters = {}): Promise<{
    phoneCalls: PhoneCall[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 20, ...filterParams } = filters;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const whereConditions: string[] = [];
      const queryParams: any[] = [];

      if (filterParams.call_type) {
        whereConditions.push('call_type = ?');
        queryParams.push(filterParams.call_type);
      }

      if (filterParams.status) {
        whereConditions.push('status = ?');
        queryParams.push(filterParams.status);
      }

      if (filterParams.priority) {
        whereConditions.push('priority = ?');
        queryParams.push(filterParams.priority);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      // Get total count
      const [countResult] = await getPool().execute(
        `SELECT COUNT(*) as total FROM phone_calls ${whereClause}`,
        queryParams
      );
      const total = (countResult as any[])[0].total;

      // Get phone calls
      const [rows] = await getPool().execute(
        `SELECT * FROM phone_calls ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      const phoneCalls = (rows as any[]).map(row => this.formatPhoneCall(row));
      const totalPages = Math.ceil(total / limit);

      return {
        phoneCalls,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to get phone calls:', error);
      throw error;
    }
  }

  /**
   * Update phone call
   */
  async updatePhoneCall(id: string, updates: UpdatePhoneCallRequest): Promise<PhoneCall | null> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      });

      if (updateFields.length === 0) {
        return this.getPhoneCallById(id);
      }

      updateValues.push(id);

      await getPool().execute(
        `UPDATE phone_calls SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      logger.info('Phone call updated successfully', { phoneCallId: id });

      return this.getPhoneCallById(id);
    } catch (error) {
      logger.error('Failed to update phone call:', error);
      throw error;
    }
  }

  /**
   * Delete phone call
   */
  async deletePhoneCall(id: string): Promise<boolean> {
    try {
      const [result] = await getPool().execute(
        'DELETE FROM phone_calls WHERE id = ?',
        [id]
      );

      const deleteResult = result as any;
      const deleted = deleteResult.affectedRows > 0;

      if (deleted) {
        logger.info('Phone call deleted successfully', { phoneCallId: id });
      }

      return deleted;
    } catch (error) {
      logger.error('Failed to delete phone call:', error);
      throw error;
    }
  }

  /**
   * Get phone call statistics
   */
  async getPhoneCallStats(): Promise<PhoneCallStats> {
    try {
      const [rows] = await getPool().execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'requested' THEN 1 ELSE 0 END) as requested,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN call_type = 'direct' THEN 1 ELSE 0 END) as direct,
          SUM(CASE WHEN call_type = 'callback_request' THEN 1 ELSE 0 END) as callback_request,
          SUM(CASE WHEN call_type = 'instagram' THEN 1 ELSE 0 END) as instagram,
          SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low_priority,
          SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium_priority,
          SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent_count
        FROM phone_calls
      `);

      const stats = (rows as any[])[0];

      return {
        total: parseInt(stats.total),
        byStatus: {
          requested: parseInt(stats.requested),
          scheduled: parseInt(stats.scheduled),
          completed: parseInt(stats.completed),
          missed: parseInt(stats.missed),
          cancelled: parseInt(stats.cancelled),
        },
        byType: {
          direct: parseInt(stats.direct),
          callback_request: parseInt(stats.callback_request),
          instagram: parseInt(stats.instagram),
        },
        byPriority: {
          low: parseInt(stats.low_priority),
          medium: parseInt(stats.medium_priority),
          high: parseInt(stats.high_priority),
        },
        recentCount: parseInt(stats.recent_count),
      };
    } catch (error) {
      logger.error('Failed to get phone call statistics:', error);
      throw error;
    }
  }

  /**
   * Send email notifications for phone call request
   */
  private async sendPhoneCallNotifications(phoneCall: PhoneCall): Promise<void> {
    if (!emailService.isAvailable()) {
      logger.warn('Email service not available, skipping phone call notifications');
      return;
    }

    try {
      // Send notification to Ian
      const callTypeText = {
        direct: 'Direct Phone Call',
        callback_request: 'Callback Request',
        instagram: 'Instagram Call'
      }[phoneCall.call_type];

      const notificationSubject = `🔔 New ${callTypeText} Request - ${phoneCall.caller_name || 'Anonymous'}`;
      
      const notificationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF4D00, #FF6B35); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📞 New Phone Call Request</h1>
            <p style="color: white; opacity: 0.9; margin: 10px 0 0 0;">Someone wants to talk with you!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 0; border-radius: 0 0 10px 10px;">
            <!-- QUICK ACTIONS -->
            <div style="background: #fff3cd; padding: 20px; border-bottom: 1px solid #eee;">
              <p style="margin: 0 0 15px 0; font-weight: bold;">📞 Quick Actions:</p>
              <div style="text-align: center;">
                ${phoneCall.caller_phone ? `
                <a href="tel:${phoneCall.caller_phone}" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 5px;">
                  📞 Call ${phoneCall.caller_name || 'Caller'}: ${phoneCall.caller_phone}
                </a>
                ` : ''}
                ${phoneCall.caller_email ? `
                <a href="mailto:${phoneCall.caller_email}?subject=Re: Your call request&body=Hi ${phoneCall.caller_name || 'there'},%0D%0A%0D%0AThank you for your call request! I'd be happy to connect with you.%0D%0A%0D%0AYou can reach me directly at +256 748 550 372 or we can schedule a convenient time to talk.%0D%0A%0D%0ABest regards,%0D%0AIan Smith" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 5px;">
                  📧 Email ${phoneCall.caller_name || 'Caller'}
                </a>
                ` : ''}
                <a href="tel:+256748550372" style="display: inline-block; background: #FF4D00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 5px;">
                  📱 Call Back: +256 748 550 372
                </a>
              </div>
            </div>

            <div style="background: white; padding: 25px; border-bottom: 1px solid #eee;">
              <h2 style="color: #333; margin-top: 0;">📞 Call Request Details</h2>
              <p><strong>Type:</strong> ${callTypeText}</p>
              <p><strong>Priority:</strong> <span style="color: ${phoneCall.priority === 'high' ? '#dc3545' : phoneCall.priority === 'medium' ? '#ffc107' : '#28a745'}; font-weight: bold; text-transform: uppercase;">${phoneCall.priority}</span></p>
              <p><strong>Status:</strong> ${phoneCall.status}</p>
              <p><strong>Source:</strong> ${phoneCall.source}</p>
              <p><strong>Requested:</strong> ${new Date(phoneCall.created_at).toLocaleString()}</p>
            </div>

            ${phoneCall.caller_name || phoneCall.caller_email || phoneCall.caller_phone ? `
            <div style="background: white; padding: 25px; border-bottom: 1px solid #eee;">
              <h3 style="color: #333; margin-top: 0;">👤 Caller Information</h3>
              ${phoneCall.caller_name ? `<p><strong>Name:</strong> <span style="font-size: 18px; color: #333;">${phoneCall.caller_name}</span></p>` : ''}
              ${phoneCall.caller_email ? `<p><strong>Email:</strong> <a href="mailto:${phoneCall.caller_email}" style="color: #007bff; font-weight: bold;">${phoneCall.caller_email}</a></p>` : ''}
              ${phoneCall.caller_phone ? `<p><strong>Phone:</strong> <a href="tel:${phoneCall.caller_phone}" style="color: #28a745; font-weight: bold; font-size: 16px;">${phoneCall.caller_phone}</a></p>` : ''}
            </div>
            ` : ''}

            ${phoneCall.message ? `
            <div style="background: white; padding: 25px; border-bottom: 1px solid #eee;">
              <h3 style="color: #333; margin-top: 0;">💬 Message</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #FF4D00;">
                <p style="line-height: 1.6; margin: 0; font-size: 16px;">"${phoneCall.message}"</p>
              </div>
            </div>
            ` : ''}

            ${phoneCall.preferred_time ? `
            <div style="background: white; padding: 25px; border-bottom: 1px solid #eee;">
              <h3 style="color: #333; margin-top: 0;">⏰ Preferred Time</h3>
              <p style="font-size: 16px; color: #28a745; font-weight: bold;">${new Date(phoneCall.preferred_time).toLocaleString()}</p>
            </div>
            ` : ''}

            <div style="background: #f8f9fa; padding: 20px; text-align: center;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                <strong>Call ID:</strong> ${phoneCall.id}<br>
                💡 <strong>Tip:</strong> ${phoneCall.caller_email ? `You can reply directly to this email to contact ${phoneCall.caller_name || 'the caller'}.` : 'Contact information is available above.'}
              </p>
            </div>
          </div>
        </div>
      `;

      await emailService.sendEmail({
        to: process.env.NOTIFICATION_EMAIL!,
        subject: notificationSubject,
        html: notificationHtml,
        // Set reply-to as the caller's email if available
        ...(phoneCall.caller_email && {
          replyTo: `"${phoneCall.caller_name || 'Caller'}" <${phoneCall.caller_email}>`,
        }),
        // Add caller information in headers for Gmail filtering
        headers: {
          'X-Caller-Email': phoneCall.caller_email || '',
          'X-Caller-Name': phoneCall.caller_name || '',
          'X-Caller-Phone': phoneCall.caller_phone || '',
          'X-Call-Type': phoneCall.call_type,
        }
      });

      logger.info('✅ Phone call notification email sent successfully', {
        phoneCallId: phoneCall.id,
        callType: phoneCall.call_type,
      });

      // Send confirmation email to caller if email provided
      if (phoneCall.caller_email) {
        const confirmationSubject = `📞 Call Request Received - Ian Smith`;
        
        const confirmationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #FF4D00, #FF6B35); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📞 Call Request Confirmed</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">Thank you${phoneCall.caller_name ? `, ${phoneCall.caller_name}` : ''}!</h2>
                <p style="line-height: 1.6;">Your ${callTypeText.toLowerCase()} request has been received and will be processed shortly.</p>
                
                <!-- PROMINENT CALL BUTTON -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="tel:+256748550372" style="display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                    📞 CALL IAN NOW: +256 748 550 372
                  </a>
                  <p style="color: #666; font-size: 14px; margin-top: 10px;">
                    <strong>Available 24/7 for urgent matters</strong><br>
                    Click the button above to call directly from your phone
                  </p>
                </div>
                
                <div style="background: #e8f5e8; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745;">
                  <h3 style="color: #333; margin-top: 0; font-size: 16px;">🚀 Want to talk right now?</h3>
                  <p style="line-height: 1.6; color: #666; margin-bottom: 15px;">
                    Don't wait for a callback! Ian is available for direct calls and loves connecting with potential clients immediately.
                  </p>
                  <div style="text-align: center;">
                    <a href="tel:+256748550372" style="display: inline-block; background: #FF4D00; color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: bold; margin: 5px;">
                      📱 Call Mobile: +256 748 550 372
                    </a>
                  </div>
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0; font-size: 16px;">What happens next?</h3>
                  <ul style="line-height: 1.6; color: #666;">
                    <li><strong>Call now</strong> using the button above for immediate response</li>
                    <li>Ian will review your request within 24 hours if you don't call</li>
                    <li>You'll receive a follow-up via email or phone</li>
                    <li>For urgent matters, direct calling is always preferred</li>
                  </ul>
                </div>

                ${phoneCall.preferred_time ? `
                <p><strong>Your preferred time:</strong> ${new Date(phoneCall.preferred_time).toLocaleString()}</p>
                ` : ''}
              </div>

              <div style="background: white; padding: 25px; border-radius: 8px; text-align: center;">
                <h3 style="color: #333; margin-top: 0;">📞 Direct Contact Information</h3>
                
                <!-- LARGE CALL BUTTON -->
                <div style="margin: 20px 0;">
                  <a href="tel:+256748550372" style="display: inline-block; background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 20px; box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4); transition: all 0.3s ease;">
                    📞 +256 748 550 372
                  </a>
                </div>
                
                <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 20px;">
                  <p style="margin: 10px 0;"><strong>📧 Email:</strong> <a href="mailto:leemeeya851@gmail.com" style="color: #FF4D00;">leemeeya851@gmail.com</a></p>
                  <p style="margin: 10px 0;"><strong>🌐 Website:</strong> <a href="https://iansmith.dev" style="color: #FF4D00;">iansmith.dev</a></p>
                  <p style="margin: 10px 0;"><strong>📍 Location:</strong> Entebbe, Uganda (EAT Timezone)</p>
                </div>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666; font-size: 14px;">
                  Best regards,<br>
                  <strong>Ian Smith</strong><br>
                  Elite Full-Stack Engineer<br>
                  <a href="tel:+256748550372" style="color: #28a745; font-weight: bold;">📞 +256 748 550 372</a>
                </p>
              </div>
            </div>
          </div>
        `;

        await emailService.sendEmail({
          to: phoneCall.caller_email,
          subject: confirmationSubject,
          html: confirmationHtml,
        });

        logger.info('✅ Phone call confirmation email sent successfully', {
          phoneCallId: phoneCall.id,
          email: phoneCall.caller_email,
        });
      }

      logger.info('Email notifications processed', {
        phoneCallId: phoneCall.id,
        notificationSent: true,
        confirmationSent: !!phoneCall.caller_email,
      });

    } catch (error) {
      logger.error('Failed to send phone call email notifications:', error);
      throw error;
    }
  }

  /**
   * Format phone call data from database
   */
  private formatPhoneCall(row: any): PhoneCall {
    return {
      id: row.id,
      caller_name: row.caller_name,
      caller_email: row.caller_email,
      caller_phone: row.caller_phone,
      call_type: row.call_type,
      message: row.message,
      status: row.status,
      priority: row.priority,
      source: row.source,
      preferred_time: row.preferred_time,
      scheduled_time: row.scheduled_time,
      duration_minutes: row.duration_minutes,
      user_agent: row.user_agent,
      ip_address: row.ip_address,
      referrer: row.referrer,
      timestamp: parseInt(row.timestamp),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const phoneCallService = new PhoneCallService();