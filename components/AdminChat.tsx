import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  User, 
  Clock, 
  RefreshCw,
  Users,
  MessageSquare,
  Eye,
  Reply
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'admin';
  timestamp: number;
}

interface ChatSession {
  id: string;
  userInfo?: {
    name?: string;
    email?: string;
    page?: string;
  };
  startedAt: number;
  lastActivity: number;
  messageCount: number;
  isActive: boolean;
  messages?: ChatMessage[];
}

interface AdminChatProps {
  apiUrl?: string;
}

const AdminChat: React.FC<AdminChatProps> = ({ 
  apiUrl = 'http://localhost:3000' 
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentSessionRef = useRef<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    console.log('Admin initializing socket connection to:', apiUrl);
    socketRef.current = io(apiUrl, {
      transports: ['websocket', 'polling'],
      timeout: 60000, // Increased to 60 seconds
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('Admin connected to chat server');
      
      // Authenticate as admin immediately
      const token = sessionStorage.getItem('admin_chat_token') || 'admin-dev-token';
      console.log('Authenticating admin with token:', token);
      socket.emit('admin-auth', { token });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsAuthenticated(false);
      console.log('Admin disconnected from chat server');
    });

    socket.on('connect_error', (error) => {
      setIsConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
      console.error('Admin connection error:', error);
      setLoading(false);
    });

    socket.on('active-sessions', (activeSessions: ChatSession[]) => {
      console.log('Admin received active sessions:', activeSessions.length);
      setSessions(activeSessions);
      setIsAuthenticated(true);
      setLoading(false);
    });

    socket.on('new-chat-session', (data: { sessionId: string; userInfo: any; page: string }) => {
      console.log('New chat session started:', data);
      // Refresh sessions list
      fetchActiveSessions();
    });

    socket.on('new-user-message', (data: { sessionId: string; message: ChatMessage; userInfo: any }) => {
      console.log('New user message:', data);
      
      // Update sessions list with new message count
      setSessions(prev => prev.map(session => 
        session.id === data.sessionId 
          ? { ...session, lastActivity: Date.now(), messageCount: session.messageCount + 1 }
          : session
      ));

      // If this is the selected session, add message to messages
      if (selectedSession?.id === data.sessionId) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(msg => msg.id === data.message.id);
          if (!messageExists) {
            return [...prev, data.message];
          }
          return prev;
        });
      }
    });

    socket.on('session-messages', (data: { sessionId: string; messages: ChatMessage[]; userInfo: any }) => {
      console.log('Admin received session messages:', data.sessionId, data.messages.length, data.messages);
      if (currentSessionRef.current === data.sessionId) {
        console.log('Setting messages for current session:', data.messages);
        setMessages(data.messages);
      }
    });

    socket.on('new-message', (message: ChatMessage) => {
      console.log('Admin received new message:', message);
      if (currentSessionRef.current === message.sessionId) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(msg => msg.id === message.id);
          if (!messageExists) {
            console.log('Adding new message to admin chat:', message);
            return [...prev, message];
          }
          console.log('Message already exists, skipping duplicate');
          return prev;
        });
      }
    });

    socket.on('user-typing', (data: { sender: 'user' | 'admin'; isTyping: boolean }) => {
      if (data.sender === 'user') {
        setIsTyping(data.isTyping);
      }
    });

    socket.on('auth-error', (error: any) => {
      console.error('Admin auth error:', error);
      setIsAuthenticated(false);
      setConnectionError(`Authentication failed: ${error.message || 'Invalid token'}`);
      setLoading(false);
    });

    return () => {
      if (socketRef.current) {
        console.log('Admin cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [apiUrl]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/v1/chat/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.data.sessions);
        console.log('Fetched sessions via API:', data.data.sessions.length);
      } else {
        console.error('Failed to fetch sessions:', response.status);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectSession = (session: ChatSession) => {
    console.log('Admin selecting session:', session.id);
    setSelectedSession(session);
    currentSessionRef.current = session.id; // Store in ref for event handlers
    setMessages([]); // Clear current messages
    
    if (socketRef.current) {
      console.log('Emitting admin-join-session for:', session.id);
      socketRef.current.emit('admin-join-session', {
        sessionId: session.id
      });
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current || !selectedSession) {
      console.log('Cannot send admin message:', { 
        hasMessage: !!newMessage.trim(), 
        hasSocket: !!socketRef.current, 
        hasSelectedSession: !!selectedSession 
      });
      return;
    }

    console.log('Admin sending message to session:', selectedSession.id);
    socketRef.current.emit('send-message', {
      message: newMessage.trim(),
      sessionId: selectedSession.id
    });

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-white/60">
            {connectionError ? connectionError : 'Loading chat sessions...'}
          </span>
        </div>
        {connectionError && (
          <div className="mt-4 text-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-lg font-semibold text-white">Live Chat Management</h2>
            <p className="text-sm text-white/40">
              {isConnected ? 'Connected' : 'Disconnected'} • {sessions.length} active sessions
            </p>
          </div>
        </div>
        <button
          onClick={fetchActiveSessions}
          disabled={loading}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        {/* Sessions List */}
        <div className="lg:col-span-1 bg-white/[0.02] border border-white/10 rounded-xl p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Active Sessions ({sessions.length})
          </h3>
          
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">No active chat sessions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <motion.button
                  key={session.id}
                  onClick={() => selectSession(session)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedSession?.id === session.id
                      ? 'bg-blue-500/20 border-blue-500/30 text-white'
                      : 'bg-white/[0.02] border-white/5 text-white/70 hover:bg-white/5'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {session.userInfo?.name || session.userInfo?.email || 'Anonymous'}
                    </span>
                    <span className="text-xs text-white/40">
                      {formatDate(session.lastActivity)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">
                      {session.userInfo?.page || 'Unknown page'}
                    </span>
                    <span className="text-xs text-white/40">
                      {session.messageCount} messages
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-xl flex flex-col">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">
                        {selectedSession.userInfo?.name || selectedSession.userInfo?.email || 'Anonymous User'}
                      </h4>
                      <p className="text-xs text-white/50">
                        Started {formatDate(selectedSession.startedAt)} • {selectedSession.userInfo?.page}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-white/40">
                    <Clock className="w-3 h-3" />
                    <span>Last active {formatDate(selectedSession.lastActivity)}</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === 'admin'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 text-white border border-white/20'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'admin' ? 'text-blue-100' : 'text-white/50'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/10 text-white border border-white/20 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your response..."
                    className="flex-1 p-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40 text-sm"
                    disabled={!isConnected}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Eye className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Select a Chat Session</h3>
                <p className="text-white/50">Choose a session from the left to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;