import { Request, Response } from 'express';
import { phoneCallService } from '../services/phoneCallService';
import { logger } from '../utils/logger';
import { 
  createPhoneCallSchema, 
  updatePhoneCallSchema, 
  phoneCallFiltersSchema 
} from '../validation/phoneCallValidation';

/**
 * Create a new phone call request
 */
export const createPhoneCall = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = createPhoneCallSchema.parse(req.body);

    // Extract metadata from request
    const metadata = {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      referrer: req.get('Referer'),
    };

    // Create phone call request
    const phoneCall = await phoneCallService.createPhoneCall(validatedData, metadata);

    logger.info('Phone call request created via API', {
      phoneCallId: phoneCall.id,
      callType: phoneCall.call_type,
      priority: phoneCall.priority,
    });

    res.status(201).json({
      success: true,
      data: phoneCall,
      message: 'Phone call request created successfully',
    });
  } catch (error) {
    logger.error('Failed to create phone call request:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: (error as any).errors,
        message: 'Validation failed',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create phone call request',
    });
  }
};

/**
 * Get phone calls with filtering and pagination
 */
export const getPhoneCalls = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const filters = phoneCallFiltersSchema.parse({
      ...req.query,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });

    const result = await phoneCallService.getPhoneCalls(filters);

    res.json({
      success: true,
      data: result,
      message: 'Phone calls retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get phone calls:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: (error as any).errors,
        message: 'Invalid query parameters',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve phone calls',
    });
  }
};

/**
 * Get phone call by ID
 */
export const getPhoneCallById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const phoneCall = await phoneCallService.getPhoneCallById(id);

    if (!phoneCall) {
      return res.status(404).json({
        success: false,
        error: 'Phone call not found',
        message: 'The requested phone call does not exist',
      });
    }

    res.json({
      success: true,
      data: phoneCall,
      message: 'Phone call retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get phone call by ID:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve phone call',
    });
  }
};

/**
 * Update phone call
 */
export const updatePhoneCall = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const validatedData = updatePhoneCallSchema.parse(req.body);

    const phoneCall = await phoneCallService.updatePhoneCall(id, validatedData);

    if (!phoneCall) {
      return res.status(404).json({
        success: false,
        error: 'Phone call not found',
        message: 'The requested phone call does not exist',
      });
    }

    logger.info('Phone call updated via API', {
      phoneCallId: id,
      updates: Object.keys(validatedData),
    });

    res.json({
      success: true,
      data: phoneCall,
      message: 'Phone call updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update phone call:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: (error as any).errors,
        message: 'Validation failed',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update phone call',
    });
  }
};

/**
 * Delete phone call
 */
export const deletePhoneCall = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await phoneCallService.deletePhoneCall(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Phone call not found',
        message: 'The requested phone call does not exist',
      });
    }

    logger.info('Phone call deleted via API', { phoneCallId: id });

    res.json({
      success: true,
      message: 'Phone call deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete phone call:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete phone call',
    });
  }
};

/**
 * Get phone call statistics
 */
export const getPhoneCallStats = async (req: Request, res: Response) => {
  try {
    const stats = await phoneCallService.getPhoneCallStats();

    res.json({
      success: true,
      data: stats,
      message: 'Phone call statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get phone call statistics:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve phone call statistics',
    });
  }
};