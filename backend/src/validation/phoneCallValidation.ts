import { z } from 'zod';

/**
 * Phone Call Request Validation Schema
 */
export const createPhoneCallSchema = z.object({
  caller_name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
  caller_email: z.string().email('Invalid email format').optional(),
  caller_phone: z.string().min(1, 'Phone number is required').max(50, 'Phone number too long').optional(),
  call_type: z.enum(['direct', 'callback_request', 'instagram']).default('direct'),
  message: z.string().max(1000, 'Message too long').optional(),
  preferred_time: z.string().datetime().optional(),
  source: z.string().max(100).default('website'),
});

export const updatePhoneCallSchema = z.object({
  status: z.enum(['requested', 'scheduled', 'completed', 'missed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  scheduled_time: z.string().datetime().optional(),
  duration_minutes: z.number().int().min(0).max(480).optional(), // Max 8 hours
  message: z.string().max(1000).optional(),
});

export const phoneCallFiltersSchema = z.object({
  call_type: z.enum(['direct', 'callback_request', 'instagram']).optional(),
  status: z.enum(['requested', 'scheduled', 'completed', 'missed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreatePhoneCallRequest = z.infer<typeof createPhoneCallSchema>;
export type UpdatePhoneCallRequest = z.infer<typeof updatePhoneCallSchema>;
export type PhoneCallFilters = z.infer<typeof phoneCallFiltersSchema>;