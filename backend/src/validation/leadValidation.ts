import { z } from 'zod';

export const createLeadSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  
  message: z.string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be less than 5000 characters')
    .trim(),
  
  type: z.enum(['contact', 'project']).default('contact'),
  
  projectType: z.string()
    .max(100, 'Project type must be less than 100 characters')
    .trim()
    .nullable()
    .optional()
    .transform(val => val || null),
  
  budget: z.string()
    .max(50, 'Budget must be less than 50 characters')
    .trim()
    .nullable()
    .optional()
    .transform(val => val || null),
  
  source: z.string()
    .max(100, 'Source must be less than 100 characters')
    .trim()
    .default('website'),
  
  timestamp: z.number()
    .int()
    .positive()
    .nullable()
    .optional()
    .transform(val => val || null)
});

export const updateLeadSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim()
    .nullable()
    .optional()
    .transform(val => val || null),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim()
    .nullable()
    .optional()
    .transform(val => val || null),
  
  message: z.string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be less than 5000 characters')
    .trim()
    .nullable()
    .optional()
    .transform(val => val || null),
  
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'closed'])
    .nullable()
    .optional()
    .transform(val => val || null),
  
  priority: z.enum(['low', 'medium', 'high'])
    .nullable()
    .optional()
    .transform(val => val || null),
  
  projectType: z.string()
    .max(100, 'Project type must be less than 100 characters')
    .trim()
    .nullable()
    .optional()
    .transform(val => val || null),
  
  budget: z.string()
    .max(50, 'Budget must be less than 50 characters')
    .trim()
    .nullable()
    .optional()
    .transform(val => val || null)
});

export const leadFiltersSchema = z.object({
  type: z.enum(['contact', 'project']).nullable().optional().transform(val => val || null),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'closed']).nullable().optional().transform(val => val || null),
  priority: z.enum(['low', 'medium', 'high']).nullable().optional().transform(val => val || null),
  source: z.string().max(100).trim().nullable().optional().transform(val => val || null),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').nullable().optional().transform(val => val || null),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').nullable().optional().transform(val => val || null),
  search: z.string().max(255).trim().nullable().optional().transform(val => val || null),
  page: z.string().transform(Number).refine(n => n > 0, 'Page must be positive').optional().default('1'),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional().default('20')
});

export const aiAnalysisSchema = z.object({
  priority: z.enum(['High', 'Medium', 'Low']),
  summary: z.string().min(1, 'Summary is required').max(500, 'Summary must be less than 500 characters'),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be less than 100 characters')
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadFiltersInput = z.infer<typeof leadFiltersSchema>;
export type AiAnalysisInput = z.infer<typeof aiAnalysisSchema>;