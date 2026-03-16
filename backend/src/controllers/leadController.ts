import { Request, Response } from 'express';
import { LeadService } from '../services/leadService';
import { AiService } from '../services/aiService';
import { emailService } from '../services/emailService';
import { 
  createLeadSchema, 
  updateLeadSchema, 
  leadFiltersSchema, 
  aiAnalysisSchema 
} from '../validation/leadValidation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const leadService = new LeadService();
const aiService = new AiService();

/**
 * Create a new lead
 * POST /api/v1/leads
 */
export const createLead = asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const validatedData = createLeadSchema.parse(req.body);
  
  // Create lead
  const lead = await leadService.createLead(validatedData);
  
  // Perform AI analysis asynchronously (don't wait for it)
  let aiAnalysis = null;
  if (aiService.isAvailable()) {
    aiService.analyzeLead(
      validatedData.name,
      validatedData.email,
      validatedData.message,
      validatedData.type
    ).then(async (analysis) => {
      try {
        await leadService.updateAiAnalysis(lead.id, analysis);
        logger.info('AI analysis completed for lead', { leadId: lead.id });
        
        // Send email notification with AI analysis
        const leadWithAI = { 
          ...validatedData, 
          projectType: validatedData.projectType || 'Not specified',
          budget: validatedData.budget || 'Not specified',
          aiAnalysis: analysis 
        };
        emailService.sendLeadNotification(leadWithAI).catch(error => {
          logger.error('Failed to send lead notification email:', error);
        });
        
        // Send confirmation email to lead
        emailService.sendLeadConfirmation(leadWithAI).catch(error => {
          logger.error('Failed to send lead confirmation email:', error);
        });
        
      } catch (error) {
        logger.error('Failed to save AI analysis:', error);
      }
    }).catch((error) => {
      logger.error('AI analysis failed:', error);
      
      // Send emails without AI analysis if AI fails
      const leadData = {
        ...validatedData,
        projectType: validatedData.projectType || 'Not specified',
        budget: validatedData.budget || 'Not specified'
      };
      emailService.sendLeadNotification(leadData).catch(error => {
        logger.error('Failed to send lead notification email:', error);
      });
      
      emailService.sendLeadConfirmation(leadData).catch(error => {
        logger.error('Failed to send lead confirmation email:', error);
      });
    });
  } else {
    // Send emails without AI analysis if AI not available
    const leadData = {
      ...validatedData,
      projectType: validatedData.projectType || 'Not specified',
      budget: validatedData.budget || 'Not specified'
    };
    emailService.sendLeadNotification(leadData).catch(error => {
      logger.error('Failed to send lead notification email:', error);
    });
    
    emailService.sendLeadConfirmation(leadData).catch(error => {
      logger.error('Failed to send lead confirmation email:', error);
    });
  }
  
  logger.info('Lead created via API', { 
    leadId: lead.id, 
    email: lead.email,
    type: lead.type 
  });
  
  res.status(201).json({
    success: true,
    data: lead,
    message: 'Lead created successfully'
  });
});

/**
 * Get all leads with filtering and pagination
 * GET /api/v1/leads
 */
export const getLeads = asyncHandler(async (req: Request, res: Response) => {
  // Validate query parameters
  const filters = leadFiltersSchema.parse(req.query);
  
  const { page, limit, ...leadFilters } = filters;
  
  // Get leads
  const result = await leadService.getLeads(leadFilters, page, limit);
  
  res.json({
    success: true,
    data: result,
    message: 'Leads retrieved successfully'
  });
});

/**
 * Get lead by ID
 * GET /api/v1/leads/:id
 */
export const getLeadById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw new AppError('Lead ID is required', 400);
  }
  
  const lead = await leadService.getLeadById(id);
  
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }
  
  res.json({
    success: true,
    data: lead,
    message: 'Lead retrieved successfully'
  });
});

/**
 * Update lead
 * PUT /api/v1/leads/:id
 */
export const updateLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw new AppError('Lead ID is required', 400);
  }
  
  // Validate input
  const validatedData = updateLeadSchema.parse(req.body);
  
  // Update lead
  const lead = await leadService.updateLead(id, validatedData);
  
  logger.info('Lead updated via API', { leadId: id });
  
  res.json({
    success: true,
    data: lead,
    message: 'Lead updated successfully'
  });
});

/**
 * Delete lead
 * DELETE /api/v1/leads/:id
 */
export const deleteLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw new AppError('Lead ID is required', 400);
  }
  
  await leadService.deleteLead(id);
  
  logger.info('Lead deleted via API', { leadId: id });
  
  res.json({
    success: true,
    message: 'Lead deleted successfully'
  });
});

/**
 * Update AI analysis for a lead
 * POST /api/v1/leads/:id/ai-analysis
 */
export const updateAiAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw new AppError('Lead ID is required', 400);
  }
  
  // Validate AI analysis data
  const validatedData = aiAnalysisSchema.parse(req.body);
  
  // Update AI analysis
  const lead = await leadService.updateAiAnalysis(id, validatedData);
  
  logger.info('AI analysis updated via API', { leadId: id, priority: validatedData.priority });
  
  res.json({
    success: true,
    data: lead,
    message: 'AI analysis updated successfully'
  });
});

/**
 * Get lead statistics
 * GET /api/v1/leads/stats
 */
export const getLeadStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await leadService.getLeadStats();
  
  res.json({
    success: true,
    data: stats,
    message: 'Lead statistics retrieved successfully'
  });
});

/**
 * Bulk update leads status
 * PATCH /api/v1/leads/bulk-update
 */
export const bulkUpdateLeads = asyncHandler(async (req: Request, res: Response) => {
  const { leadIds, updates } = req.body;
  
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    throw new AppError('Lead IDs array is required', 400);
  }
  
  if (!updates || typeof updates !== 'object') {
    throw new AppError('Updates object is required', 400);
  }
  
  // Validate updates
  const validatedUpdates = updateLeadSchema.parse(updates);
  
  // Update leads in parallel
  const updatePromises = leadIds.map(id => 
    leadService.updateLead(id, validatedUpdates)
  );
  
  const updatedLeads = await Promise.all(updatePromises);
  
  logger.info('Bulk lead update via API', { 
    count: leadIds.length, 
    updates: Object.keys(validatedUpdates) 
  });
  
  res.json({
    success: true,
    data: updatedLeads,
    message: `${updatedLeads.length} leads updated successfully`
  });
});