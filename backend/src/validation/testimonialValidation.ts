import { z } from 'zod';

export const createTestimonialSchema = z.object({
  client_name: z.string().min(1, 'Client name is required').max(255),
  client_email: z.string().email().optional().or(z.literal('')),
  client_company: z.string().max(255).optional(),
  client_position: z.string().max(255).optional(),
  client_avatar: z.string().url().optional().or(z.literal('')),
  content: z.string().min(10, 'Content must be at least 10 characters').max(2000),
  rating: z.number().int().min(1).max(5),
  project_title: z.string().max(255).optional(),
  project_category: z.string().max(100).optional(),
  is_featured: z.boolean().optional(),
  is_approved: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
  source: z.string().max(100).optional(),
  project_id: z.string().uuid().optional()
});

export const updateTestimonialSchema = z.object({
  client_name: z.string().min(1).max(255).optional(),
  client_email: z.string().email().optional().or(z.literal('')),
  client_company: z.string().max(255).optional(),
  client_position: z.string().max(255).optional(),
  client_avatar: z.string().url().optional().or(z.literal('')),
  content: z.string().min(10).max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  project_title: z.string().max(255).optional(),
  project_category: z.string().max(100).optional(),
  is_featured: z.boolean().optional(),
  is_approved: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
  source: z.string().max(100).optional(),
  project_id: z.string().uuid().optional()
});

export const testimonialFiltersSchema = z.object({
  is_featured: z.string().transform(val => val === 'true').optional(),
  is_approved: z.string().transform(val => val === 'true').optional(),
  rating: z.string().transform(val => parseInt(val)).optional(),
  client_company: z.string().optional(),
  project_category: z.string().optional(),
  source: z.string().optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)).optional()
});