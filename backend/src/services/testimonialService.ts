import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/connection';
import { logger } from '../utils/logger';
import { 
  Testimonial, 
  CreateTestimonialData, 
  UpdateTestimonialData, 
  TestimonialFilters 
} from '../types/Testimonial';

export class TestimonialService {
  async createTestimonial(data: CreateTestimonialData): Promise<Testimonial> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const testimonial: Testimonial = {
      id,
      client_name: data.client_name,
      client_email: data.client_email || null,
      client_company: data.client_company || null,
      client_position: data.client_position || null,
      client_avatar: data.client_avatar || null,
      content: data.content,
      rating: data.rating,
      project_title: data.project_title || null,
      project_category: data.project_category || null,
      is_featured: data.is_featured || false,
      is_approved: data.is_approved || false,
      display_order: data.display_order || 0,
      source: data.source || 'direct',
      project_id: data.project_id || null,
      created_at: now,
      updated_at: now
    };

    const query = `
      INSERT INTO testimonials (
        id, client_name, client_email, client_company, client_position, 
        client_avatar, content, rating, project_title, project_category,
        is_featured, is_approved, display_order, source, project_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      testimonial.id,
      testimonial.client_name,
      testimonial.client_email,
      testimonial.client_company,
      testimonial.client_position,
      testimonial.client_avatar,
      testimonial.content,
      testimonial.rating,
      testimonial.project_title,
      testimonial.project_category,
      testimonial.is_featured,
      testimonial.is_approved,
      testimonial.display_order,
      testimonial.source,
      testimonial.project_id,
      testimonial.created_at,
      testimonial.updated_at
    ];

    await db.execute(query, values);
    
    logger.info('Testimonial created', { 
      testimonialId: id, 
      clientName: data.client_name,
      rating: data.rating 
    });
    
    return testimonial;
  }

  async getTestimonials(
    filters: TestimonialFilters = {}, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{
    testimonials: Testimonial[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    const conditions: string[] = [];
    const values: any[] = [];
    
    if (filters.is_featured !== undefined) {
      conditions.push('is_featured = ?');
      values.push(filters.is_featured);
    }
    
    if (filters.is_approved !== undefined) {
      conditions.push('is_approved = ?');
      values.push(filters.is_approved);
    }
    
    if (filters.rating !== undefined) {
      conditions.push('rating >= ?');
      values.push(filters.rating);
    }
    
    if (filters.client_company) {
      conditions.push('client_company LIKE ?');
      values.push(`%${filters.client_company}%`);
    }
    
    if (filters.project_category) {
      conditions.push('project_category = ?');
      values.push(filters.project_category);
    }
    
    if (filters.source) {
      conditions.push('source = ?');
      values.push(filters.source);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM testimonials ${whereClause}`;
    const [countResult] = await db.execute(countQuery, values) as any[];
    const total = countResult[0].total;
    
    // Get testimonials
    const query = `
      SELECT * FROM testimonials 
      ${whereClause}
      ORDER BY display_order DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.execute(query, [...values, limit, offset]) as any[];
    
    return {
      testimonials: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getTestimonialById(id: string): Promise<Testimonial | null> {
    const query = 'SELECT * FROM testimonials WHERE id = ?';
    const [rows] = await db.execute(query, [id]) as any[];
    
    return rows.length > 0 ? rows[0] : null;
  }

  async updateTestimonial(id: string, data: UpdateTestimonialData): Promise<Testimonial> {
    const existing = await this.getTestimonialById(id);
    if (!existing) {
      throw new Error('Testimonial not found');
    }

    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (updates.length === 0) {
      return existing;
    }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    const query = `UPDATE testimonials SET ${updates.join(', ')} WHERE id = ?`;
    await db.execute(query, values);
    
    logger.info('Testimonial updated', { testimonialId: id });
    
    return await this.getTestimonialById(id) as Testimonial;
  }

  async deleteTestimonial(id: string): Promise<void> {
    const query = 'DELETE FROM testimonials WHERE id = ?';
    const [result] = await db.execute(query, [id]) as any[];
    
    if (result.affectedRows === 0) {
      throw new Error('Testimonial not found');
    }
    
    logger.info('Testimonial deleted', { testimonialId: id });
  }

  async getFeaturedTestimonials(limit: number = 6): Promise<Testimonial[]> {
    const query = `
      SELECT * FROM testimonials 
      WHERE is_featured = true AND is_approved = true
      ORDER BY display_order DESC, created_at DESC
      LIMIT ?
    `;
    
    const [rows] = await db.execute(query, [limit]) as any[];
    return rows;
  }

  async getTestimonialStats(): Promise<{
    total: number;
    approved: number;
    featured: number;
    averageRating: number;
    byRating: Record<number, number>;
    bySource: Record<string, number>;
  }> {
    // Get total counts
    const totalQuery = 'SELECT COUNT(*) as total FROM testimonials';
    const [totalResult] = await db.execute(totalQuery) as any[];
    const total = totalResult[0].total;
    
    const approvedQuery = 'SELECT COUNT(*) as approved FROM testimonials WHERE is_approved = true';
    const [approvedResult] = await db.execute(approvedQuery) as any[];
    const approved = approvedResult[0].approved;
    
    const featuredQuery = 'SELECT COUNT(*) as featured FROM testimonials WHERE is_featured = true';
    const [featuredResult] = await db.execute(featuredQuery) as any[];
    const featured = featuredResult[0].featured;
    
    // Get average rating
    const avgQuery = 'SELECT AVG(rating) as avg_rating FROM testimonials WHERE is_approved = true';
    const [avgResult] = await db.execute(avgQuery) as any[];
    const averageRating = parseFloat(avgResult[0].avg_rating) || 0;
    
    // Get rating distribution
    const ratingQuery = 'SELECT rating, COUNT(*) as count FROM testimonials WHERE is_approved = true GROUP BY rating';
    const [ratingResult] = await db.execute(ratingQuery) as any[];
    const byRating: Record<number, number> = {};
    ratingResult.forEach((row: any) => {
      byRating[row.rating] = row.count;
    });
    
    // Get source distribution
    const sourceQuery = 'SELECT source, COUNT(*) as count FROM testimonials GROUP BY source';
    const [sourceResult] = await db.execute(sourceQuery) as any[];
    const bySource: Record<string, number> = {};
    sourceResult.forEach((row: any) => {
      bySource[row.source] = row.count;
    });
    
    return {
      total,
      approved,
      featured,
      averageRating: Math.round(averageRating * 10) / 10,
      byRating,
      bySource
    };
  }
}