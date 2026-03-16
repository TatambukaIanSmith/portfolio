# 💬 Real-Time Chat System

A comprehensive WebSocket-based chat system integrated into Ian Smith's portfolio platform, providing real-time communication between visitors and administrators.

## 🚀 Features

### **User Features**
- **Real-time messaging** with WebSocket connections
- **Persistent chat sessions** across page refreshes
- **Typing indicators** for better user experience
- **Mobile-responsive** chat widget
- **Unread message notifications** when chat is minimized
- **Auto-reconnection** on connection loss

### **Admin Features**
- **Multi-session management** - handle multiple chats simultaneously
- **Real-time notifications** for new messages and sessions
- **Session history** and message persistence
- **User information display** (page, referrer, location)
- **Typing indicators** from users
- **Quick replies** for common responses
- **Chat analytics** and performance metrics

### **Technical Features**
- **WebSocket communication** using Socket.IO
- **Session persistence** with localStorage
- **Graceful degradation** when backend is unavailable
- **Security measures** with admin authentication
- **Performance optimization** with message pagination
- **Comprehensive logging** and error handling

## 📁 File Structure

```
backend/src/
├── services/
│   └── chatService.ts          # Core WebSocket service
├── controllers/
│   └── chatController.ts       # REST API endpoints
├── routes/
│   └── chatRoutes.ts          # API route definitions
└── scripts/
    └── testChat.ts            # Chat system testing

components/
├── ChatWidget.tsx             # User-facing chat widget
└── AdminChat.tsx              # Admin chat management interface

backend/
├── chat_tables.sql            # Database schema
└── CHAT_SYSTEM_README.md      # This documentation
```

## 🛠 Installation & Setup

### **1. Backend Dependencies**
```bash
cd backend
npm install socket.io @types/socket.io
```

### **2. Frontend Dependencies**
```bash
npm install socket.io-client
```

### **3. Database Setup**
```bash
# Import the chat tables into your MySQL database
mysql -u root -p iansmith_portfolio < backend/chat_tables.sql
```

### **4. Environment Variables**
Add to your `backend/.env`:
```env
# Chat System Configuration
ADMIN_CHAT_TOKEN=your-secure-admin-token-here
CHAT_SESSION_TIMEOUT=1800000  # 30 minutes in milliseconds
```

## 🚀 Usage

### **Starting the System**

1. **Start the backend server:**
```bash
cd backend
npm run dev
```

2. **Start the frontend:**
```bash
npm run dev
```

3. **Test the chat system:**
```bash
cd backend
npm run test:chat
```

### **User Experience**

1. **Chat Widget appears** in bottom-right corner after site initialization
2. **Click the chat button** to open the chat window
3. **Type messages** and receive real-time responses
4. **Session persists** across page navigation
5. **Notifications show** for new admin messages when chat is closed

### **Admin Experience**

1. **Access AdminPanel** by clicking the shield icon in footer
2. **Navigate to "Live Chat" tab**
3. **View active sessions** in the left sidebar
4. **Click a session** to start chatting
5. **Send messages** and see typing indicators
6. **Monitor session metrics** and user information

## 🔧 API Endpoints

### **Chat Management (Admin Only)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/chat/sessions` | Get all active chat sessions |
| GET | `/api/v1/chat/sessions/:id` | Get specific chat session with messages |
| POST | `/api/v1/chat/sessions/:id/message` | Send message to chat session |
| GET | `/api/v1/chat/stats` | Get chat statistics |
| POST | `/api/v1/chat/cleanup` | Cleanup inactive sessions |

### **Example API Usage**

```javascript
// Get active sessions
const response = await fetch('/api/v1/chat/sessions');
const { data } = await response.json();
console.log('Active sessions:', data.sessions);

// Send admin message
await fetch('/api/v1/chat/sessions/session-id/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello from admin!' })
});
```

## 🔌 WebSocket Events

### **Client Events (User)**
```javascript
// Join chat session
socket.emit('join-chat', {
  sessionId: 'optional-existing-session-id',
  userInfo: { name: 'John', email: 'john@example.com' },
  page: '/current-page'
});

// Send message
socket.emit('send-message', {
  message: 'Hello!',
  sessionId: 'session-id'
});

// Typing indicator
socket.emit('typing', {
  sessionId: 'session-id',
  isTyping: true
});
```

### **Server Events (Received by Client)**
```javascript
// Chat session joined
socket.on('chat-joined', (data) => {
  console.log('Session ID:', data.sessionId);
  console.log('Message history:', data.messages);
});

// New message received
socket.on('new-message', (message) => {
  console.log('New message:', message);
});

// User typing indicator
socket.on('user-typing', (data) => {
  console.log('User typing:', data.isTyping);
});
```

### **Admin Events**
```javascript
// Authenticate as admin
socket.emit('admin-auth', { token: 'admin-token' });

// Join specific session
socket.emit('admin-join-session', { sessionId: 'session-id' });

// Receive active sessions
socket.on('active-sessions', (sessions) => {
  console.log('Active sessions:', sessions);
});

// New chat session notification
socket.on('new-chat-session', (data) => {
  console.log('New session started:', data);
});
```

## 📊 Database Schema

### **Core Tables**

1. **`chat_sessions`** - Chat session management
2. **`chat_messages`** - Individual messages
3. **`chat_analytics`** - Performance metrics
4. **`chat_quick_replies`** - Predefined responses
5. **`chat_settings`** - System configuration

### **Key Relationships**
- Sessions → Messages (1:many)
- Users → Sessions (1:many as admin)
- Sessions → Analytics (aggregated)

## 🧪 Testing

### **Automated Testing**
```bash
# Run comprehensive chat system test
npm run test:chat
```

### **Manual Testing Checklist**

**User Flow:**
- [ ] Chat widget appears and is clickable
- [ ] Can open/close chat window
- [ ] Can send messages and receive responses
- [ ] Typing indicators work
- [ ] Session persists across page refresh
- [ ] Unread message notifications appear

**Admin Flow:**
- [ ] Can access admin chat interface
- [ ] Can see active sessions
- [ ] Can join sessions and view message history
- [ ] Can send messages to users
- [ ] Real-time updates work
- [ ] Session information displays correctly

**Technical:**
- [ ] WebSocket connections establish successfully
- [ ] Messages are delivered in real-time
- [ ] Error handling works gracefully
- [ ] Performance is acceptable under load

## 🔒 Security Features

### **Authentication**
- Admin token-based authentication
- Session-based user identification
- IP address tracking and validation

### **Data Protection**
- Input sanitization and validation
- XSS protection for messages
- Rate limiting on message sending
- Secure WebSocket connections

### **Privacy**
- User data encryption in transit
- Session cleanup for inactive chats
- GDPR-compliant data handling
- Optional user information collection

## 📈 Performance Optimization

### **Backend Optimizations**
- Connection pooling for WebSocket connections
- Message pagination to limit memory usage
- Automatic cleanup of inactive sessions
- Efficient session lookup with Map data structure

### **Frontend Optimizations**
- Lazy loading of chat components
- Debounced typing indicators
- Optimistic UI updates
- Efficient re-rendering with React keys

### **Scalability Considerations**
- Horizontal scaling with Redis adapter (future)
- Database indexing for fast queries
- CDN support for static assets
- Load balancing for multiple server instances

## 🚀 Future Enhancements

### **Phase 2 Features**
- [ ] File upload support in chat
- [ ] Emoji and rich text formatting
- [ ] Chat history export
- [ ] Automated chatbot responses
- [ ] Video/voice call integration

### **Phase 3 Features**
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with CRM systems
- [ ] Mobile app notifications
- [ ] AI-powered response suggestions

## 🐛 Troubleshooting

### **Common Issues**

**Chat widget not appearing:**
- Check if `hasStarted` state is true
- Verify WebSocket connection in browser dev tools
- Ensure backend server is running on correct port

**Messages not sending:**
- Check WebSocket connection status
- Verify session ID is valid
- Check browser console for errors

**Admin can't see sessions:**
- Verify admin authentication token
- Check if sessions exist in database
- Ensure admin socket is properly authenticated

**Performance issues:**
- Check message history size (implement pagination)
- Monitor WebSocket connection count
- Review server resource usage

### **Debug Commands**
```bash
# Check WebSocket connections
netstat -an | grep :3001

# Monitor chat logs
tail -f backend/logs/app.log | grep chat

# Test database connectivity
npm run test:db
```

## 📞 Support

For technical support or feature requests:
- **Email:** leemeeya851@gmail.com
- **GitHub Issues:** Create an issue in the repository
- **Documentation:** Check this README and inline code comments

## 📄 License

This chat system is part of Ian Smith's portfolio platform and follows the same licensing terms as the main project.

---

**Built with ❤️ using TypeScript, Socket.IO, React, and MySQL**