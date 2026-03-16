import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';
import ChatService from '../services/chatService';

class ChatController {
  private chatService: ChatService;

  constructor(chatService: ChatService) {
    this.chatService = chatService;
  }

  // Get all active chat sessions (admin only)
  public getActiveSessions = async (req: Request, res: Response) => {
    try {
      const sessions = this.chatService.getActiveSessions();
      
      return successResponse(res, {
        sessions: sessions.map(session => ({
          id: session.id,
          userInfo: session.userInfo,
          startedAt: session.startedAt,
          lastActivity: session.lastActivity,
          messageCount: session.messages.length,
          isActive: session.isActive
        }))
      }, 'Active chat sessions retrieved successfully');
    } catch (error) {
      logger.error('Error getting active sessions:', error);
      return errorResponse(res, 'Failed to retrieve chat sessions', 500);
    }
  };

  // Get specific chat session with messages (admin only)
  public getSession = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = this.chatService.getSession(sessionId);

      if (!session) {
        return errorResponse(res, 'Chat session not found', 404);
      }

      return successResponse(res, {
        session: {
          id: session.id,
          userInfo: session.userInfo,
          startedAt: session.startedAt,
          lastActivity: session.lastActivity,
          isActive: session.isActive,
          messages: session.messages
        }
      }, 'Chat session retrieved successfully');
    } catch (error) {
      logger.error('Error getting chat session:', error);
      return errorResponse(res, 'Failed to retrieve chat session', 500);
    }
  };

  // Send message to chat session (admin only)
  public sendMessage = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { message } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return errorResponse(res, 'Message is required', 400);
      }

      const success = this.chatService.sendAdminMessage(
        sessionId, 
        message.trim(),
        req.user?.id // Assuming auth middleware adds user to request
      );

      if (!success) {
        return errorResponse(res, 'Chat session not found', 404);
      }

      return successResponse(res, {
        message: 'Message sent successfully'
      }, 'Message sent to chat session');
    } catch (error) {
      logger.error('Error sending chat message:', error);
      return errorResponse(res, 'Failed to send message', 500);
    }
  };

  // Get chat statistics (admin only)
  public getChatStats = async (req: Request, res: Response) => {
    try {
      const sessions = this.chatService.getActiveSessions();
      const allSessions = Array.from((this.chatService as any).activeSessions.values());

      const stats = {
        activeSessions: sessions.length,
        totalSessions: allSessions.length,
        totalMessages: allSessions.reduce((sum, session) => sum + session.messages.length, 0),
        averageMessagesPerSession: allSessions.length > 0 
          ? Math.round(allSessions.reduce((sum, session) => sum + session.messages.length, 0) / allSessions.length)
          : 0,
        sessionsToday: allSessions.filter(session => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return session.startedAt >= today.getTime();
        }).length
      };

      return successResponse(res, { stats }, 'Chat statistics retrieved successfully');
    } catch (error) {
      logger.error('Error getting chat statistics:', error);
      return errorResponse(res, 'Failed to retrieve chat statistics', 500);
    }
  };

  // Cleanup inactive sessions (admin only)
  public cleanupSessions = async (req: Request, res: Response) => {
    try {
      const { maxInactiveMinutes = 30 } = req.body;
      const maxInactiveTime = maxInactiveMinutes * 60 * 1000;
      
      const cleanedCount = this.chatService.cleanupInactiveSessions(maxInactiveTime);

      return successResponse(res, {
        cleanedSessions: cleanedCount
      }, `Cleaned up ${cleanedCount} inactive sessions`);
    } catch (error) {
      logger.error('Error cleaning up chat sessions:', error);
      return errorResponse(res, 'Failed to cleanup chat sessions', 500);
    }
  };
}

export default ChatController;