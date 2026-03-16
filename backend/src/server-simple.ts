import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import axios from 'axios';

// Import routes
import newsRoutes from './routes/newsRoutes';
import marketsRoutes from './routes/marketsRoutes';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = 3000;

// Initialize Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Connect to Redis with error handling
redisClient.connect().catch((err) => {
  console.log('Redis connection failed, using in-memory cache:', err.message);
});

redisClient.on('error', (err) => {
  console.log('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

// Fallback in-memory cache if Redis fails
const memoryCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

// Cache helper functions
const getFromCache = async (key: string): Promise<any | null> => {
  try {
    if (redisClient.isOpen) {
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } else {
      // Fallback to memory cache
      const item = memoryCache.get(key);
      if (item && Date.now() - item.timestamp < CACHE_TTL) {
        return item.data;
      }
      memoryCache.delete(key);
      return null;
    }
  } catch (error) {
    console.log('Cache get error:', error);
    return null;
  }
};

const setInCache = async (key: string, data: any, ttl: number = 60): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.setEx(key, ttl, JSON.stringify(data));
    } else {
      // Fallback to memory cache
      memoryCache.set(key, {
        data,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.log('Cache set error:', error);
  }
};

// Basic middleware
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"]
}));
app.use(express.json());

// Serve static files from frontend build
const frontendDistPath = path.join(__dirname, '../../dist');
app.use(express.static(frontendDistPath));

// Initialize Socket.IO with enhanced CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Real-time news tracking
let latestNewsTimestamp = 0;
let connectedClients = 0;

// Enhanced news fetching with caching
const fetchLatestNews = async (category: string = 'general', forceRefresh: boolean = false): Promise<any[]> => {
  const cacheKey = `latest_news_${category}`;
  
  if (!forceRefresh) {
    const cached = await getFromCache(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit for ${category} news`);
      return cached;
    }
  }

  console.log(`🔄 Fetching fresh ${category} news from APIs...`);
  
  try {
    // Try NewsAPI first
    const newsApiKey = process.env.NEWSAPI_KEY;
    let articles: any[] = [];

    if (newsApiKey) {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          apiKey: newsApiKey,
          category: category === 'general' ? undefined : category,
          country: 'us',
          pageSize: 50,
          language: 'en'
        },
        timeout: 10000
      });

      if (response.data.articles) {
        articles = response.data.articles.map((article: any) => ({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: article.title,
          description: article.description || 'No description available',
          source: article.source?.name || 'Unknown',
          image: article.urlToImage,
          url: article.url,
          publishedAt: article.publishedAt,
          category: category,
          isBreaking: Math.random() > 0.8 // 20% chance of being breaking news
        }));
      }
    }

    // If no articles from API, use demo data
    if (articles.length === 0) {
      articles = generateDemoNews(category);
    }

    // Sort by publication date
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Cache the results
    await setInCache(cacheKey, articles, 60); // Cache for 1 minute

    return articles;
  } catch (error) {
    console.error('Error fetching news:', error);
    return generateDemoNews(category);
  }
};

// Generate demo news with current timestamps
const generateDemoNews = (category: string): any[] => {
  const currentYear = new Date().getFullYear();
  const now = Date.now();
  
  const demoArticles = [
    {
      id: `demo_${now}_1`,
      title: `🚨 BREAKING: ${currentYear} Major Development in ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      description: `Latest breaking news from ${category} sector with significant implications for the industry and global markets.`,
      source: 'Reuters',
      image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop',
      url: `#breaking-${category}-${now}`,
      publishedAt: new Date(now - Math.random() * 3600000).toISOString(), // Within last hour
      category,
      isBreaking: true
    },
    {
      id: `demo_${now}_2`,
      title: `${currentYear} Innovation: Revolutionary Changes in ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      description: `Experts analyze the latest trends and developments that are shaping the future of ${category} in ${currentYear}.`,
      source: 'Bloomberg',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
      url: `#innovation-${category}-${now}`,
      publishedAt: new Date(now - Math.random() * 7200000).toISOString(), // Within last 2 hours
      category,
      isBreaking: false
    },
    {
      id: `demo_${now}_3`,
      title: `Market Update ${currentYear}: ${category.charAt(0).toUpperCase() + category.slice(1)} Sector Shows Strong Growth`,
      description: `Financial analysts report positive trends in the ${category} sector with promising outlook for the remainder of ${currentYear}.`,
      source: 'Financial Times',
      image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=400&fit=crop',
      url: `#market-${category}-${now}`,
      publishedAt: new Date(now - Math.random() * 10800000).toISOString(), // Within last 3 hours
      category,
      isBreaking: false
    }
  ];

  return demoArticles;
};

// Real-time news polling and WebSocket push
const startNewsPolling = () => {
  console.log('🔄 Starting real-time news polling...');
  
  setInterval(async () => {
    if (connectedClients === 0) return; // Don't poll if no clients connected

    try {
      const categories = ['general', 'technology', 'business', 'sports', 'health'];
      
      for (const category of categories) {
        const news = await fetchLatestNews(category, true); // Force refresh
        
        if (news.length > 0) {
          const latestArticle = news[0];
          const articleTimestamp = new Date(latestArticle.publishedAt).getTime();
          
          // Check if this is newer than our last known article
          if (articleTimestamp > latestNewsTimestamp) {
            latestNewsTimestamp = articleTimestamp;
            
            console.log(`📡 Broadcasting new ${category} article:`, latestArticle.title);
            
            // Broadcast to all connected clients
            io.emit('newArticle', {
              article: latestArticle,
              category,
              timestamp: Date.now()
            });

            // If it's breaking news, send special notification
            if (latestArticle.isBreaking) {
              io.emit('breakingNews', {
                article: latestArticle,
                category,
                timestamp: Date.now()
              });
            }

            // Update ticker
            io.emit('tickerUpdate', {
              text: `🔴 ${latestArticle.title}`,
              category,
              timestamp: Date.now()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in news polling:', error);
    }
  }, 30000); // Poll every 30 seconds
};

// Simple in-memory storage
const activeSessions = new Map();
const adminSockets = new Set();

// Enhanced Socket.IO handlers
io.on('connection', (socket) => {
  connectedClients++;
  console.log(`📱 Client connected: ${socket.id} (Total: ${connectedClients})`);

  // Send initial news data
  socket.emit('connected', {
    message: 'Connected to real-time news feed',
    timestamp: Date.now()
  });

  // Handle news subscription
  socket.on('subscribe-news', async (data) => {
    const { categories = ['general'] } = data;
    console.log(`📰 Client ${socket.id} subscribed to:`, categories);
    
    // Join category rooms
    categories.forEach((category: string) => {
      socket.join(`news-${category}`);
    });

    // Send initial news for subscribed categories
    for (const category of categories) {
      const news = await fetchLatestNews(category);
      socket.emit('initialNews', {
        category,
        articles: news.slice(0, 10), // Send first 10 articles
        timestamp: Date.now()
      });
    }
  });

  // Handle pagination requests
  socket.on('loadMore', async (data) => {
    const { category = 'general', page = 1, limit = 10 } = data;
    console.log(`📄 Loading more ${category} news - Page ${page}`);
    
    const news = await fetchLatestNews(category);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedNews = news.slice(start, end);
    
    socket.emit('moreNews', {
      category,
      articles: paginatedNews,
      page,
      hasMore: end < news.length,
      total: news.length,
      timestamp: Date.now()
    });
  });

  // Handle chat functionality (existing)
  socket.on('join-chat', (data) => {
    console.log(`join-chat event received from ${socket.id}:`, data);
    const sessionId = data.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let session = activeSessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        userInfo: data.userInfo || {},
        messages: [],
        startedAt: Date.now(),
        lastActivity: Date.now(),
        isActive: true
      };
      activeSessions.set(sessionId, session);
      console.log(`Created new session: ${sessionId}`);
    } else {
      session.userInfo = { ...session.userInfo, ...data.userInfo };
      session.lastActivity = Date.now();
      session.isActive = true;
      console.log(`Updated existing session: ${sessionId}`);
    }
    
    socket.join(sessionId);
    socket.data.sessionId = sessionId;
    
    socket.emit('chat-joined', {
      sessionId,
      messages: session.messages
    });

    io.to('admins').emit('new-chat-session', {
      sessionId,
      userInfo: session.userInfo,
      page: data.page
    });

    const sessions = Array.from(activeSessions.values()).map(s => ({
      id: s.id,
      userInfo: s.userInfo,
      startedAt: s.startedAt,
      lastActivity: s.lastActivity,
      messageCount: s.messages.length,
      isActive: s.isActive
    }));
    io.to('admins').emit('active-sessions', sessions);
  });

  // Handle admin authentication (existing)
  socket.on('admin-auth', (data) => {
    console.log(`admin-auth event received from ${socket.id}:`, data);
    if (data.token === 'admin-dev-token') {
      adminSockets.add(socket.id);
      socket.join('admins');
      
      const sessions = Array.from(activeSessions.values()).map(session => ({
        id: session.id,
        userInfo: session.userInfo,
        startedAt: session.startedAt,
        lastActivity: session.lastActivity,
        messageCount: session.messages.length,
        isActive: session.isActive
      }));
      
      socket.emit('active-sessions', sessions);
      console.log(`Admin authenticated: ${socket.id}, sent ${sessions.length} sessions`);
    } else {
      socket.emit('auth-error', { message: 'Invalid admin token' });
    }
  });

  // Handle messages (existing)
  socket.on('send-message', (data) => {
    console.log(`Received message from ${socket.id}: ${JSON.stringify(data)}`);
    
    const session = activeSessions.get(data.sessionId);
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    const isAdmin = adminSockets.has(socket.id);
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: data.sessionId,
      message: data.message,
      sender: isAdmin ? 'admin' : 'user',
      timestamp: Date.now()
    };

    session.messages.push(message);
    session.lastActivity = Date.now();

    io.to(data.sessionId).emit('new-message', message);

    if (message.sender === 'user') {
      io.to('admins').emit('new-user-message', {
        sessionId: data.sessionId,
        message,
        userInfo: session.userInfo
      });
      
      const sessions = Array.from(activeSessions.values()).map(s => ({
        id: s.id,
        userInfo: s.userInfo,
        startedAt: s.startedAt,
        lastActivity: s.lastActivity,
        messageCount: s.messages.length,
        isActive: s.isActive
      }));
      io.to('admins').emit('active-sessions', sessions);
    }
  });

  // Handle admin joining session (existing)
  socket.on('admin-join-session', (data) => {
    if (adminSockets.has(socket.id)) {
      socket.join(data.sessionId);
      
      const session = activeSessions.get(data.sessionId);
      if (session) {
        socket.emit('session-messages', {
          sessionId: data.sessionId,
          messages: session.messages,
          userInfo: session.userInfo
        });
      } else {
        socket.emit('session-messages', {
          sessionId: data.sessionId,
          messages: [],
          userInfo: {}
        });
      }
    }
  });

  // Handle typing (existing)
  socket.on('typing', (data) => {
    const senderType = adminSockets.has(socket.id) ? 'admin' : 'user';
    socket.to(data.sessionId).emit('user-typing', {
      sessionId: data.sessionId,
      sender: senderType,
      isTyping: data.isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`📱 Client disconnected: ${socket.id} (Total: ${connectedClients})`);
    adminSockets.delete(socket.id);
    
    if (socket.data.sessionId) {
      const session = activeSessions.get(socket.data.sessionId);
      if (session) {
        session.isActive = false;
        session.lastActivity = Date.now();
      }
    }
  });
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    chat: {
      activeSessions: activeSessions.size,
      connectedAdmins: adminSockets.size
    }
  });
});

// Enhanced API Routes with caching and pagination
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/markets', marketsRoutes);

// Real-time news API endpoints
app.get('/api/v1/news/live', async (req, res) => {
  try {
    const { category = 'general', page = 1, limit = 10 } = req.query;
    
    const news = await fetchLatestNews(category as string);
    const start = (parseInt(page as string) - 1) * parseInt(limit as string);
    const end = start + parseInt(limit as string);
    const paginatedNews = news.slice(start, end);
    
    res.json({
      success: true,
      data: {
        articles: paginatedNews,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: news.length,
          pages: Math.ceil(news.length / parseInt(limit as string)),
          hasMore: end < news.length
        },
        category: category as string,
        timestamp: Date.now(),
        cached: true
      }
    });
  } catch (error) {
    console.error('Live news API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live news'
    });
  }
});

// Breaking news endpoint
app.get('/api/v1/news/breaking', async (req, res) => {
  try {
    const categories = ['general', 'technology', 'business', 'sports', 'health'];
    const breakingNews = [];
    
    for (const category of categories) {
      const news = await fetchLatestNews(category);
      const breaking = news.filter(article => article.isBreaking).slice(0, 2);
      breakingNews.push(...breaking);
    }
    
    // Sort by timestamp
    breakingNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    res.json({
      success: true,
      data: {
        articles: breakingNews.slice(0, 10),
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Breaking news API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breaking news'
    });
  }
});

// News ticker endpoint
app.get('/api/v1/news/ticker', async (req, res) => {
  try {
    const categories = ['general', 'technology', 'business', 'sports'];
    const tickerItems = [];
    
    for (const category of categories) {
      const news = await fetchLatestNews(category);
      const latest = news.slice(0, 3).map(article => ({
        text: `🔴 ${article.title}`,
        category,
        url: article.url,
        timestamp: article.publishedAt
      }));
      tickerItems.push(...latest);
    }
    
    // Sort by timestamp
    tickerItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json({
      success: true,
      data: {
        items: tickerItems.slice(0, 20),
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Ticker API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticker data'
    });
  }
});

// Chat API endpoints
app.get('/api/v1/chat/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.values()).map(session => ({
    id: session.id,
    userInfo: session.userInfo,
    startedAt: session.startedAt,
    lastActivity: session.lastActivity,
    messageCount: session.messages.length,
    isActive: session.isActive
  }));
  
  console.log(`API: Returning ${sessions.length} sessions`);
  
  res.json({
    success: true,
    data: { sessions }
  });
});

app.get('/api/v1/chat/sessions/:sessionId', (req, res) => {
  const session = activeSessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
  
  res.json({
    success: true,
    data: { session }
  });
});

// Serve frontend for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  }
  
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Real-time News Intelligence Server running on port ${PORT}`);
  console.log(`💬 Chat service initialized with WebSocket support`);
  console.log(`📡 Real-time news feed active`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📰 Live news API: http://localhost:${PORT}/api/v1/news/live`);
  console.log(`🚨 Breaking news API: http://localhost:${PORT}/api/v1/news/breaking`);
  console.log(`📊 News ticker API: http://localhost:${PORT}/api/v1/news/ticker`);
  
  // Start real-time news polling
  startNewsPolling();
});

export default app;