import { Request, Response } from 'express';
import { TestimonialService } from '../services/testimonialService';
import { 
  createTestimonialSchema, 
  updateTestimonialSchema, 
  testimonialFiltersSchema 
} from '../validation/testimonialValidation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const testimonialService = new TestimonialService();

/**
 * Create a new testimonial
 * POST /api/v1/testimonials
 */
export const createTestimonial = asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const validatedData = createTestimonialSchema.parse(req.body);
  
  // Create testimonial
  const testimonial = await testimonialService.createTestimonial(validatedData);
  
  logger.info('Testimonial created via API', { 
    testimonialId: testimonial.id, 
    clientName: testimonial.client_name,
    rating: testimonial.rating 
  });
  
  res.status(201).json({
    success: true,
    data: testimonial,
    message: 'Testimonial created successfully'
  });
});

/**
 * Get all testimonials with filtering and pagination
 * GET /api/v1/testimonials
 */
export const getTestimonials = asyncHandler(async (req: Request, res: Response) => {
  // Validate query parameters
  const filters = testimonialFiltersSchema.parse(req.query);
  
  const { page, limit, ...testimonialFilters } = filters;
  
  // Get testimonials
  const result = await testimonialService.getTestimonials(testimonialFilters, page, limit);
  
  res.json({
    success: true,
    data: result,
    message: 'Testimonials retrieved successfully'
  });
});

/**
 * Get featured testimonials for public display
 * GET /api/v1/testimonials/featured
 */
export const getFeaturedTestimonials = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 6;
  
  const testimonials = await testimonialService.getFeaturedTestimonials(limit);
  
  res.json({
    success: true,
    data: testimonials,
    message: 'Featured testimonials retrieved successfully'
  });
});

/**
 * Get testimonial by ID
 * GET /api/v1/testimonials/:id
 */
export const getTestimonialById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw new AppError('Testimonial ID is required', 400);
  }
  
  const testimonial = await testimonialService.getTestimonialById(id);
  
  if (!testimonial) {
    throw new AppError('Testimonial not found', 404);
  }
  
  res.json({
    success: true,
    data: testimonial,
    message: 'Testimonial retrieved successfully'
  });
});

/**
 * Update testimonial
 * PUT /api/v1/testimonials/:id
 */
export const updateTestimonial = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw new AppError('Testimonial ID is required', 400);
  }
  
  // Validate input
  const validatedData = updateTestimonialSchema.parse(req.body);
  
  // Update testimonial
  const testimonial = await testimonialService.updateTestimonial(id, validatedData);
  
  logger.info('Testimonial updated via API', { testimonialId: id });
  
  res.json({
    success: true,
    data: testimonial,
    message: 'Testimonial updated successfully'
  });
});

/**
 * Delete testimonial
 * DELETE /api/v1/testimonials/:id
 */
export const deleteTestimonial = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw new AppError('Testimonial ID is required', 400);
  }
  
  await testimonialService.deleteTestimonial(id);
  
  logger.info('Testimonial deleted via API', { testimonialId: id });
  
  res.json({
    success: true,
    message: 'Testimonial deleted successfully'
  });
});

/**
 * Get testimonial statistics
 * GET /api/v1/testimonials/stats
 */
export const getTestimonialStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await testimonialService.getTestimonialStats();
  
  res.json({
    success: true,
    data: stats,
    message: 'Testimonial statistics retrieved successfully'
  });
});