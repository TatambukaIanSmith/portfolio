import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, transaction } from '../database/connection';
import { Lead, CreateLeadDto, UpdateLeadDto, LeadFilters, PaginatedLeads } from '../types/Lead';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { emailService } from './emailService';

export class LeadService {
  
  /**
   * Create a new lead
   */
  async createLead(leadData: CreateLeadDto): Promise<Lead> {
    try {
      const leadId = uuidv4();
      const now = new Date();
      const timestamp = leadData.timestamp || Date.now();

      const sql = `
        INSERT INTO leads (
          id, name, email, message, type, project_type, budget, 
          status, priority, source, timestamp, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        leadId,
        leadData.name,
        leadData.email,
        leadData.message,
        leadData.type || 'contact',
        leadData.projectType || null,
        leadData.budget || null,
        'new', // Default status
        'medium', // Default priority
        leadData.source || 'website',
        timestamp,
        now,
        now
      ];

      await query(sql, params);

      // Fetch and return the created lead
      const createdLead = await this.getLeadById(leadId);
      if (!createdLead) {
        throw new AppError('Failed to create lead', 500);
      }

      logger.info('Lead created successfully', { leadId, email: leadData.email });
      
      // Send email notifications (async, don't wait for completion)
      this.sendEmailNotifications(createdLead).catch(error => {
        logger.error('Failed to send email notifications:', error);
        // Don't throw error - email failure shouldn't fail lead creation
      });
      
      return createdLead;
    } catch (error) {
      logger.error('Error creating lead:', error);
      throw error instanceof AppError ? error : new AppError('Failed to create lead', 500);
    }
  }

  /**
   * Get lead by ID
   */
  async getLeadById(id: string): Promise<Lead | null> {
    try {
      const sql = `
        SELECT 
          id, name, email, message, type, project_type as projectType, budget,
          status, priority, source, ai_analysis as aiAnalysis,
          timestamp, created_at as createdAt, updated_at as updatedAt
        FROM leads 
        WHERE id = ?
      `;

      const lead = await queryOne<any>(sql, [id]);
      
      if (!lead) {
        return null;
      }

      return this.mapDatabaseRowToLead(lead);
    } catch (error) {
      logger.error('Error fetching lead by ID:', error);
      throw new AppError('Failed to fetch lead', 500);
    }
  }

  /**
   * Get all leads with filtering and pagination
   */
  async getLeads(
    filters: LeadFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedLeads> {
    try {
      const offset = (page - 1) * limit;
      
      // Build WHERE clause
      const whereConditions: string[] = [];
      const params: any[] = [];

      if (filters.type) {
        whereConditions.push('type = ?');
        params.push(filters.type);
      }

      if (filters.status) {
        whereConditions.push('status = ?');
        params.push(filters.status);
      }

      if (filters.priority) {
        whereConditions.push('priority = ?');
        params.push(filters.priority);
      }

      if (filters.source) {
        whereConditions.push('source = ?');
        params.push(filters.source);
      }

      if (filters.dateFrom) {
        whereConditions.push('DATE(created_at) >= ?');
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        whereConditions.push('DATE(created_at) <= ?');
        params.push(filters.dateTo);
      }

      if (filters.search) {
        whereConditions.push('(name LIKE ? OR email LIKE ? OR message LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM leads ${whereClause}`;
      const countResult = await queryOne<{ total: number }>(countSql, params);
      const total = countResult?.total || 0;

      // Get leads
      const leadsSql = `
        SELECT 
          id, name, email, message, type, project_type as projectType, budget,
          status, priority, source, ai_analysis as aiAnalysis,
          timestamp, created_at as createdAt, updated_at as updatedAt
        FROM leads 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const leadsResult = await query<any>(leadsSql, [...params, limit, offset]);
      const leads = leadsResult.map(row => this.mapDatabaseRowToLead(row));

      return {
        leads,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error fetching leads:', error);
      throw new AppError('Failed to fetch leads', 500);
    }
  }

  /**
   * Update lead
   */
  async updateLead(id: string, updateData: UpdateLeadDto): Promise<Lead> {
    try {
      const existingLead = await this.getLeadById(id);
      if (!existingLead) {
        throw new AppError('Lead not found', 404);
      }

      const updateFields: string[] = [];
      const params: any[] = [];

      // Build dynamic update query
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'projectType') {
            updateFields.push('project_type = ?');
          } else {
            updateFields.push(`${key} = ?`);
          }
          params.push(value);
        }
      });

      if (updateFields.length === 0) {
        return existingLead; // No updates needed
      }

      updateFields.push('updated_at = ?');
      params.push(new Date());
      params.push(id); // For WHERE clause

      const sql = `
        UPDATE leads 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await query(sql, params);

      // Fetch and return updated lead
      const updatedLead = await this.getLeadById(id);
      if (!updatedLead) {
        throw new AppError('Failed to update lead', 500);
      }

      logger.info('Lead updated successfully', { leadId: id });
      return updatedLead;
    } catch (error) {
      logger.error('Error updating lead:', error);
      throw error instanceof AppError ? error : new AppError('Failed to update lead', 500);
    }
  }

  /**
   * Delete lead
   */
  async deleteLead(id: string): Promise<void> {
    try {
      const existingLead = await this.getLeadById(id);
      if (!existingLead) {
        throw new AppError('Lead not found', 404);
      }

      const sql = 'DELETE FROM leads WHERE id = ?';
      await query(sql, [id]);

      logger.info('Lead deleted successfully', { leadId: id });
    } catch (error) {
      logger.error('Error deleting lead:', error);
      throw error instanceof AppError ? error : new AppError('Failed to delete lead', 500);
    }
  }

  /**
   * Update AI analysis for a lead
   */
  async updateAiAnalysis(
    id: string, 
    aiAnalysis: { priority: 'High' | 'Medium' | 'Low'; summary: string; category: string }
  ): Promise<Lead> {
    try {
      const existingLead = await this.getLeadById(id);
      if (!existingLead) {
        throw new AppError('Lead not found', 404);
      }

      const sql = `
        UPDATE leads 
        SET ai_analysis = ?, priority = ?, updated_at = ?
        WHERE id = ?
      `;

      // Map AI priority to lead priority
      const priority = aiAnalysis.priority.toLowerCase() as 'low' | 'medium' | 'high';

      await query(sql, [
        JSON.stringify(aiAnalysis),
        priority,
        new Date(),
        id
      ]);

      // Fetch and return updated lead
      const updatedLead = await this.getLeadById(id);
      if (!updatedLead) {
        throw new AppError('Failed to update AI analysis', 500);
      }

      logger.info('AI analysis updated successfully', { leadId: id, priority });
      return updatedLead;
    } catch (error) {
      logger.error('Error updating AI analysis:', error);
      throw error instanceof AppError ? error : new AppError('Failed to update AI analysis', 500);
    }
  }

  /**
   * Get lead statistics
   */
  async getLeadStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    recentCount: number;
  }> {
    try {
      // Total leads
      const totalResult = await queryOne<{ total: number }>('SELECT COUNT(*) as total FROM leads');
      const total = totalResult?.total || 0;

      // By status
      const statusResults = await query<{ status: string; count: number }>(
        'SELECT status, COUNT(*) as count FROM leads GROUP BY status'
      );
      const byStatus = statusResults.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {} as Record<string, number>);

      // By priority
      const priorityResults = await query<{ priority: string; count: number }>(
        'SELECT priority, COUNT(*) as count FROM leads GROUP BY priority'
      );
      const byPriority = priorityResults.reduce((acc, row) => {
        acc[row.priority] = row.count;
        return acc;
      }, {} as Record<string, number>);

      // By type
      const typeResults = await query<{ type: string; count: number }>(
        'SELECT type, COUNT(*) as count FROM leads GROUP BY type'
      );
      const byType = typeResults.reduce((acc, row) => {
        acc[row.type] = row.count;
        return acc;
      }, {} as Record<string, number>);

      // Recent leads (last 7 days)
      const recentResult = await queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM leads WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
      );
      const recentCount = recentResult?.count || 0;

      return {
        total,
        byStatus,
        byPriority,
        byType,
        recentCount
      };
    } catch (error) {
      logger.error('Error fetching lead stats:', error);
      throw new AppError('Failed to fetch lead statistics', 500);
    }
  }

  /**
   * Get detailed lead analytics for dashboard
   */
  async getDetailedAnalytics(): Promise<{
    conversionFunnel: Array<{ status: string; count: number; percentage: number }>;
    sourceAnalytics: Array<{ source: string; count: number; conversion_rate: number }>;
    timeAnalytics: Array<{ date: string; leads_count: number; project_leads: number; high_priority_leads: number }>;
    aiInsights: Array<{ category: string; count: number; conversion_rate: number }>;
    recentActivity: Array<any>;
    conversionRate: number;
    avgResponseTime: number;
  }> {
    try {
      // Conversion funnel
      const conversionFunnel = await query<{ status: string; count: number; percentage: number }>(`
        SELECT 
          status,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM leads)), 2) as percentage
        FROM leads 
        GROUP BY status
        ORDER BY 
          CASE status 
            WHEN 'new' THEN 1 
            WHEN 'contacted' THEN 2 
            WHEN 'qualified' THEN 3 
            WHEN 'converted' THEN 4 
            WHEN 'closed' THEN 5 
          END
      `);

      // Source analytics
      const sourceAnalytics = await query<{ source: string; count: number; conversion_rate: number }>(`
        SELECT 
          source,
          COUNT(*) as count,
          ROUND(AVG(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) * 100, 2) as conversion_rate
        FROM leads 
        GROUP BY source
        ORDER BY count DESC
      `);

      // Time analytics (last 30 days)
      const timeAnalytics = await query<{ 
        date: string; 
        leads_count: number; 
        project_leads: number; 
        high_priority_leads: number 
      }>(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as leads_count,
          COUNT(CASE WHEN type = 'project' THEN 1 END) as project_leads,
          COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_leads
        FROM leads 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `);

      // AI insights
      const aiInsights = await query<{ category: string; count: number; conversion_rate: number }>(`
        SELECT 
          JSON_EXTRACT(ai_analysis, '$.category') as category,
          COUNT(*) as count,
          AVG(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) * 100 as conversion_rate
        FROM leads 
        WHERE ai_analysis IS NOT NULL
        GROUP BY JSON_EXTRACT(ai_analysis, '$.category')
        ORDER BY count DESC
      `);

      // Recent activity
      const recentActivity = await query<any>(`
        SELECT 
          id, name, email, type, status, priority,
          JSON_EXTRACT(ai_analysis, '$.category') as category,
          created_at
        FROM leads 
        ORDER BY created_at DESC 
        LIMIT 10
      `);

      // Conversion rate
      const conversionResult = await queryOne<{ rate: number }>(`
        SELECT 
          ROUND(
            (COUNT(CASE WHEN status = 'converted' THEN 1 END) * 100.0 / COUNT(*)), 2
          ) as rate
        FROM leads
      `);
      const conversionRate = conversionResult?.rate || 0;

      // Average response time
      const responseTimeResult = await queryOne<{ avg_hours: number }>(`
        SELECT 
          ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)), 1) as avg_hours
        FROM leads 
        WHERE status != 'new' AND updated_at > created_at
      `);
      const avgResponseTime = responseTimeResult?.avg_hours || 0;

      return {
        conversionFunnel,
        sourceAnalytics,
        timeAnalytics,
        aiInsights,
        recentActivity,
        conversionRate,
        avgResponseTime
      };
    } catch (error) {
      logger.error('Error fetching detailed analytics:', error);
      throw new AppError('Failed to fetch detailed analytics', 500);
    }
  }

  /**
   * Map database row to Lead object
   */
  private mapDatabaseRowToLead(row: any): Lead {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      message: row.message,
      type: row.type,
      projectType: row.projectType,
      budget: row.budget,
      status: row.status,
      priority: row.priority,
      source: row.source,
      aiAnalysis: row.aiAnalysis ? JSON.parse(row.aiAnalysis) : undefined,
      timestamp: row.timestamp,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  /**
   * Send email notifications for new lead
   */
  private async sendEmailNotifications(lead: Lead): Promise<void> {
    try {
      if (emailService.isAvailable()) {
        // Send notification to Ian
        const notificationSent = await emailService.sendLeadNotification(lead);
        
        // Send confirmation to the lead
        const confirmationSent = await emailService.sendLeadConfirmation(lead);
        
        logger.info('Email notifications processed', {
          leadId: lead.id,
          notificationSent,
          confirmationSent
        });
      } else {
        logger.warn('Email service not available - skipping notifications', { leadId: lead.id });
      }
    } catch (error) {
      logger.error('Error sending email notifications:', error);
      // Don't throw - email failure shouldn't fail lead creation
    }
  }
}