import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Minimize2, User, Bot } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'admin';
  timestamp: number;
}

interface ChatWidgetProps {
  apiUrl?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  apiUrl = 'http://localhost:3000' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    // Connect immediately when component mounts, not just when chat is opened
    if (!socketRef.current) {
      console.log('Initializing socket connection to:', apiUrl);
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
        console.log('Connected to chat server');
        
        // Join chat session immediately upon connection
        const storedSessionId = localStorage.getItem('chat_session_id');
        console.log('Joining chat with stored session:', storedSessionId);
        socket.emit('join-chat', {
          sessionId: storedSessionId,
          userInfo: {
            page: window.location.pathname,
            referrer: document.referrer,
            userAgent: navigator.userAgent
          },
          page: window.location.pathname
        });
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Disconnected from chat server');
      });

      socket.on('connect_error', (error) => {
        setIsConnected(false);
        setConnectionError(`Connection failed: ${error.message}`);
        console.error('Connection error:', error);
      });

      socket.on('chat-joined', (data: { sessionId: string; messages: ChatMessage[] }) => {
        setSessionId(data.sessionId);
        setMessages(data.messages);
        localStorage.setItem('chat_session_id', data.sessionId);
        console.log('Joined chat session:', data.sessionId, 'with', data.messages.length, 'messages');
      });

      socket.on('new-message', (message: ChatMessage) => {
        console.log('User received new message:', message);
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(msg => msg.id === message.id);
          if (!messageExists) {
            return [...prev, message];
          }
          return prev;
        });
        
        // If message is from admin and chat is closed/minimized, show notification
        if (message.sender === 'admin' && (!isOpen || isMinimized)) {
          setHasUnreadMessages(true);
        }
      });

      socket.on('user-typing', (data: { sender: 'user' | 'admin'; isTyping: boolean }) => {
        if (data.sender === 'admin') {
          setIsTyping(data.isTyping);
        }
      });

      socket.on('error', (error: any) => {
        console.error('Chat error:', error);
        setConnectionError(`Chat error: ${error.message || 'Unknown error'}`);
      });
    }

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [apiUrl]); // Remove isOpen dependency

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear unread messages when chat is opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setHasUnreadMessages(false);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current || !sessionId) {
      console.log('Cannot send message:', { 
        hasMessage: !!newMessage.trim(), 
        hasSocket: !!socketRef.current, 
        hasSessionId: !!sessionId 
      });
      return;
    }

    console.log('Sending message to session:', sessionId);
    socketRef.current.emit('send-message', {
      message: newMessage.trim(),
      sessionId
    });

    setNewMessage('');
  };

  const handleTyping = (isTyping: boolean) => {
    if (!socketRef.current || !sessionId) return;

    socketRef.current.emit('typing', {
      sessionId,
      isTyping
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicators
    handleTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 1000);
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

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isConnected 
            ? 'bg-accent-primary hover:bg-accent-primary/90' 
            : 'bg-gray-500 hover:bg-gray-600'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              {hasUnreadMessages && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 60 : 480
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-accent-primary text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Chat with Ian</h3>
                  <p className="text-xs text-white/80">
                    {isConnected ? 'Online' : 'Connecting...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={minimizeChat}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleChat}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {!isConnected && connectionError && (
                    <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm font-medium">Connection Error</p>
                      <p className="text-xs mt-1">{connectionError}</p>
                      <button 
                        onClick={() => window.location.reload()} 
                        className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  
                  {messages.length === 0 && isConnected ? (
                    <div className="text-center text-gray-500 mt-8">
                      <Bot className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Start a conversation!</p>
                      <p className="text-xs text-gray-400 mt-1">
                        I'll get back to you as soon as possible.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl ${
                            message.sender === 'user'
                              ? 'bg-accent-primary text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white text-gray-800 border border-gray-200 p-3 rounded-2xl">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder={isConnected ? "Type your message..." : "Connecting..."}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent text-sm text-gray-900 bg-white"
                      disabled={!isConnected}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || !isConnected || !sessionId}
                      className="p-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={!isConnected ? "Not connected" : !sessionId ? "No session" : "Send message"}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  {!isConnected && (
                    <p className="text-xs text-red-500 mt-1">
                      Connection status: {connectionError || 'Connecting...'}
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;