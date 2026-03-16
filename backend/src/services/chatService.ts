import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  sessionId: string;
  message: string;
  sender: 'user' | 'admin';
  timestamp: number;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    page?: string;
  };
}

export interface ChatSession {
  id: string;
  userId?: string;
  isActive: boolean;
  startedAt: number;
  lastActivity: number;
  messages: ChatMessage[];
  userInfo?: {
    name?: string;
    email?: string;
    page?: string;
  };
}

class ChatService {
  private io: SocketIOServer;
  private activeSessions: Map<string, ChatSession> = new Map();
  private adminSockets: Set<string> = new Set();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
    logger.info('Chat service initialized');
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Handle user joining chat
      socket.on('join-chat', (data: { sessionId?: string; userInfo?: any; page?: string }) => {
        const sessionId = data.sessionId || uuidv4();
        const session = this.getOrCreateSession(sessionId, data.userInfo, data.page);
        
        socket.join(sessionId);
        socket.data.sessionId = sessionId;
        
        // Send session info and message history
        socket.emit('chat-joined', {
          sessionId,
          messages: session.messages.slice(-50) // Last 50 messages
        });

        // Notify admins of new chat
        this.notifyAdmins('new-chat-session', {
          sessionId,
          userInfo: session.userInfo,
          page: data.page
        });

        logger.info(`User joined chat session: ${sessionId}`);
      });

      // Handle admin authentication
      socket.on('admin-auth', (data: { token: string }) => {
        // In a real app, verify JWT token here
        if (this.verifyAdminToken(data.token)) {
          this.adminSockets.add(socket.id);
          socket.join('admins');
          
          // Send all active sessions to admin
          socket.emit('active-sessions', Array.from(this.activeSessions.values()));
          logger.info(`Admin authenticated: ${socket.id}`);
        } else {
          socket.emit('auth-error', { message: 'Invalid admin token' });
        }
      });

      // Handle messages
      socket.on('send-message', (data: { message: string; sessionId: string }) => {
        logger.info(`Received message from ${socket.id}: sessionId=${data.sessionId}, message="${data.message}"`);
        
        const session = this.activeSessions.get(data.sessionId);
        if (!session) {
          logger.error(`Session not found: ${data.sessionId}. Available sessions: ${Array.from(this.activeSessions.keys()).join(', ')}`);
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const message: ChatMessage = {
          id: uuidv4(),
          sessionId: data.sessionId,
          message: data.message,
          sender: this.adminSockets.has(socket.id) ? 'admin' : 'user',
          timestamp: Date.now(),
          metadata: {
            userAgent: socket.handshake.headers['user-agent'],
            ipAddress: socket.handshake.address
          }
        };

        // Add message to session
        session.messages.push(message);
        session.lastActivity = Date.now();

        // Broadcast to all participants in the session
        this.io.to(data.sessionId).emit('new-message', message);
        logger.info(`Message broadcasted to session ${data.sessionId}`);

        // If user message, notify admins
        if (message.sender === 'user') {
          this.notifyAdmins('new-user-message', {
            sessionId: data.sessionId,
            message,
            userInfo: session.userInfo
          });
        }

        logger.info(`Message sent in session ${data.sessionId}: ${message.sender}`);
      });

      // Handle admin joining specific session
      socket.on('admin-join-session', (data: { sessionId: string }) => {
        if (this.adminSockets.has(socket.id)) {
          socket.join(data.sessionId);
          
          const session = this.activeSessions.get(data.sessionId);
          if (session) {
            socket.emit('session-messages', {
              sessionId: data.sessionId,
              messages: session.messages,
              userInfo: session.userInfo
            });
          }
        }
      });

      // Handle typing indicators
      socket.on('typing', (data: { sessionId: string; isTyping: boolean }) => {
        const senderType = this.adminSockets.has(socket.id) ? 'admin' : 'user';
        socket.to(data.sessionId).emit('user-typing', {
          sessionId: data.sessionId,
          sender: senderType,
          isTyping: data.isTyping
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
        this.adminSockets.delete(socket.id);
        
        // Mark session as inactive if user disconnects
        if (socket.data.sessionId) {
          const session = this.activeSessions.get(socket.data.sessionId);
          if (session) {
            session.isActive = false;
            session.lastActivity = Date.now();
          }
        }
      });
    });
  }

  private getOrCreateSession(sessionId: string, userInfo?: any, page?: string): ChatSession {
    let session = this.activeSessions.get(sessionId);
    
    if (!session) {
      session = {
        id: sessionId,
        isActive: true,
        startedAt: Date.now(),
        lastActivity: Date.now(),
        messages: [],
        userInfo: userInfo ? { ...userInfo, page } : { page }
      };
      this.activeSessions.set(sessionId, session);
    } else {
      session.isActive = true;
      session.lastActivity = Date.now();
      if (userInfo) {
        session.userInfo = { ...session.userInfo, ...userInfo };
      }
    }

    return session;
  }

  private notifyAdmins(event: string, data: any) {
    this.io.to('admins').emit(event, data);
  }

  private verifyAdminToken(token: string): boolean {
    // Simple token verification - in production, use proper JWT verification
    return token === process.env.ADMIN_CHAT_TOKEN || token === 'admin-dev-token';
  }

  // Public methods for external use
  public getActiveSessions(): ChatSession[] {
    return Array.from(this.activeSessions.values()).filter(s => s.isActive);
  }

  public getSession(sessionId: string): ChatSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  public sendAdminMessage(sessionId: string, message: string, adminId?: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const chatMessage: ChatMessage = {
      id: uuidv4(),
      sessionId,
      message,
      sender: 'admin',
      timestamp: Date.now(),
      metadata: { adminId }
    };

    session.messages.push(chatMessage);
    session.lastActivity = Date.now();

    this.io.to(sessionId).emit('new-message', chatMessage);
    return true;
  }

  // Cleanup inactive sessions (call periodically)
  public cleanupInactiveSessions(maxInactiveTime: number = 30 * 60 * 1000) { // 30 minutes
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [sessionId, session] of this.activeSessions) {
      if (now - session.lastActivity > maxInactiveTime) {
        toDelete.push(sessionId);
      }
    }

    toDelete.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
      logger.info(`Cleaned up inactive session: ${sessionId}`);
    });

    return toDelete.length;
  }
}

export default ChatService;