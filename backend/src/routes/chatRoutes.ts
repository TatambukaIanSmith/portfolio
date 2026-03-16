import { Router } from 'express';
import ChatController from '../controllers/chatController';
import ChatService from '../services/chatService';

const router = Router();

// Initialize chat controller with chat service
// Note: ChatService will be initialized in server.ts and passed here
let chatController: ChatController;

export const initializeChatRoutes = (chatService: ChatService) => {
  chatController = new ChatController(chatService);
  return router;
};

// All chat routes require admin authentication
// router.use(authMiddleware); // Uncomment when auth is implemented

// GET /api/v1/chat/sessions - Get all active chat sessions
router.get('/sessions', (req, res) => chatController.getActiveSessions(req, res));

// GET /api/v1/chat/sessions/:sessionId - Get specific chat session
router.get('/sessions/:sessionId', (req, res) => chatController.getSession(req, res));

// POST /api/v1/chat/sessions/:sessionId/message - Send message to session
router.post('/sessions/:sessionId/message', (req, res) => chatController.sendMessage(req, res));

// GET /api/v1/chat/stats - Get chat statistics
router.get('/stats', (req, res) => chatController.getChatStats(req, res));

// POST /api/v1/chat/cleanup - Cleanup inactive sessions
router.post('/cleanup', (req, res) => chatController.cleanupSessions(req, res));

export default router;