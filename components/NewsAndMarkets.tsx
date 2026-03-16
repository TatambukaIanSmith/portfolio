import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  RefreshCw, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown,
  Globe,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  BookOpen,
  Zap,
  Bell,
  Wifi,
  WifiOff
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import NewsReaderModal from './NewsReaderModal';

interface Article {
  id: string;
  title: string;
  description: string;
  source: string;
  image: string | null;
  url: string;
  publishedAt: string;
  category: string;
  isBreaking?: boolean;
}

interface TickerItem {
  text: string;
  category: string;
  url: string;
  timestamp: string;
}

interface NewsResponse {
  success: boolean;
  articles: Article[];
  totalResults: number;
  page: number;
  category: string;
  cached?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface ForexPair {
  from: string;
  to: string;
  rate: number;
  lastRefreshed: string;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
}

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
}

const NewsAndMarkets: React.FC = () => {
  // News state
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Real-time state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [breakingNews, setBreakingNews] = useState<Article[]>([]);
  const [newArticleCount, setNewArticleCount] = useState(0);

  // Markets state
  const [forexPairs, setForexPairs] = useState<ForexPair[]>([]);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [marketsError, setMarketsError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'news' | 'markets'>('news');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [showBreakingAlert, setShowBreakingAlert] = useState(false);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('📡 Connected to real-time news feed');
      setIsConnected(true);
      setSocket(newSocket);
      
      // Subscribe to news categories
      newSocket.emit('subscribe-news', {
        categories: ['general', 'technology', 'business', 'sports', 'health']
      });
    });

    newSocket.on('disconnect', () => {
      console.log('📡 Disconnected from news feed');
      setIsConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('📰 News feed ready:', data.message);
    });

    newSocket.on('initialNews', (data) => {
      console.log(`📰 Received initial ${data.category} news:`, data.articles.length);
      if (data.category === activeCategory) {
        setArticles(data.articles);
        setTotalResults(data.articles.length);
      }
    });

    newSocket.on('newArticle', (data) => {
      console.log('🚨 New article received:', data.article.title);
      
      // Add to articles if it matches current category
      if (data.category === activeCategory || activeCategory === 'general') {
        setArticles(prev => {
          // Check if article already exists
          const exists = prev.some(article => article.id === data.article.id);
          if (!exists) {
            setNewArticleCount(count => count + 1);
            return [data.article, ...prev];
          }
          return prev;
        });
      }
    });

    newSocket.on('breakingNews', (data) => {
      console.log('🚨 BREAKING NEWS:', data.article.title);
      setBreakingNews(prev => [data.article, ...prev.slice(0, 4)]); // Keep last 5
      setShowBreakingAlert(true);
      
      // Auto-hide alert after 10 seconds
      setTimeout(() => setShowBreakingAlert(false), 10000);
    });

    newSocket.on('tickerUpdate', (data) => {
      setTickerItems(prev => {
        const newItems = [data, ...prev.slice(0, 19)]; // Keep last 20
        return newItems;
      });
    });

    newSocket.on('moreNews', (data) => {
      console.log(`📄 Received more ${data.category} news:`, data.articles.length);
      if (data.category === activeCategory) {
        setArticles(prev => [...prev, ...data.articles]);
        setHasMore(data.hasMore);
        loadingRef.current = false;
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Update active category subscription
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('subscribe-news', {
        categories: [activeCategory]
      });
    }
  }, [activeCategory, socket, isConnected]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    fetchTickerData();
    fetchBreakingNews();
  }, []);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (loadingRef.current || !hasMore || activeTab !== 'news') return;

      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.offsetHeight;

      if (scrollTop + windowHeight >= docHeight - 200) {
        loadMoreNews();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, activeTab, activeCategory]);

  // Fetch markets data on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'markets') {
      fetchMarketsData();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/news/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTickerData = async () => {
    try {
      const response = await fetch('/api/v1/news/ticker');
      const data = await response.json();
      if (data.success) {
        setTickerItems(data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch ticker data:', error);
    }
  };

  const fetchBreakingNews = async () => {
    try {
      const response = await fetch('/api/v1/news/breaking');
      const data = await response.json();
      if (data.success) {
        setBreakingNews(data.data.articles);
      }
    } catch (error) {
      console.error('Failed to fetch breaking news:', error);
    }
  };

  const fetchNews = async (silent = false) => {
    if (!silent) setNewsLoading(true);
    setNewsError(null);

    try {
      const params = new URLSearchParams({
        category: activeCategory,
        page: '1',
        limit: '20'
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const response = await fetch(`/api/v1/news/live?${params}`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data.articles);
        setTotalResults(data.data.pagination.total);
        setHasMore(data.data.pagination.hasMore);
        setCurrentPage(1);
        setNewArticleCount(0);
      } else {
        setNewsError(data.error || 'Failed to fetch news');
      }
    } catch (error) {
      setNewsError('Network error occurred');
      console.error('News fetch error:', error);
    } finally {
      if (!silent) setNewsLoading(false);
    }
  };

  const loadMoreNews = async () => {
    if (loadingRef.current || !hasMore) return;
    
    loadingRef.current = true;
    
    if (socket && isConnected) {
      socket.emit('loadMore', {
        category: activeCategory,
        page: currentPage + 1,
        limit: 10
      });
      setCurrentPage(prev => prev + 1);
    }
  };

  const fetchMarketsData = async (silent = false) => {
    if (!silent) setMarketsLoading(true);
    setMarketsError(null);

    try {
      // Fetch forex pairs and market indices in parallel
      const [forexResponse, indicesResponse] = await Promise.all([
        fetch('/api/v1/markets/forex/popular'),
        fetch('/api/v1/markets/indices')
      ]);

      const [forexData, indicesData] = await Promise.all([
        forexResponse.json(),
        indicesResponse.json()
      ]);

      if (forexData.success) {
        setForexPairs(forexData.pairs);
      }

      if (indicesData.success) {
        setMarketIndices(indicesData.indices);
      }

      if (!forexData.success && !indicesData.success) {
        setMarketsError('Failed to fetch market data');
      }
    } catch (error) {
      setMarketsError('Network error occurred');
      console.error('Markets fetch error:', error);
    } finally {
      if (!silent) setMarketsLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setCurrentPage(1);
    setSearchQuery('');
    setArticles([]);
    setNewArticleCount(0);
    fetchNews();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveCategory('general');
    setArticles([]);
    fetchNews();
  };

  const refreshNews = () => {
    setArticles([]);
    setNewArticleCount(0);
    fetchNews();
    fetchTickerData();
    fetchBreakingNews();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatCurrency = (value: number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const openArticleReader = (article: Article, index: number) => {
    setSelectedArticle(article);
    setCurrentArticleIndex(index);
    setIsReaderOpen(true);
  };

  const navigateArticle = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? Math.max(0, currentArticleIndex - 1)
      : Math.min(articles.length - 1, currentArticleIndex + 1);
    
    setCurrentArticleIndex(newIndex);
    setSelectedArticle(articles[newIndex]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-900 via-space-800 to-space-900 text-white">
      {/* Bloomberg-style Live Ticker - Mobile Responsive */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-red-500 overflow-hidden">
        <div className="flex items-center h-6 sm:h-8">
          <div className="bg-red-600 px-2 sm:px-3 py-1 text-xs font-bold text-white flex items-center">
            <Zap className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
            <span className="hidden sm:inline">LIVE</span>
            <span className="sm:hidden">●</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div 
              className="whitespace-nowrap text-xs sm:text-sm text-white"
              style={{
                animation: 'marquee 60s linear infinite',
                display: 'inline-block'
              }}
            >
              {tickerItems.map((item, index) => (
                <span key={index} className="mx-4 sm:mx-8">
                  {item.text}
                </span>
              ))}
              {tickerItems.length === 0 && (
                <span className="mx-4 sm:mx-8">🔴 Real-time news feed loading...</span>
              )}
            </div>
          </div>
          <div className="flex items-center px-2 sm:px-3 text-xs text-white/60">
            {isConnected ? (
              <>
                <Wifi className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                <span className="hidden sm:inline">LIVE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                <span className="hidden sm:inline">OFFLINE</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add CSS animation styles */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      {/* Breaking News Alert - Mobile Responsive */}
      <AnimatePresence>
        {showBreakingAlert && breakingNews.length > 0 && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-6 sm:top-8 left-2 right-2 sm:left-4 sm:right-4 z-40 bg-red-600 border border-red-500 rounded-lg p-3 sm:p-4 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white mt-0.5 animate-pulse flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white text-xs sm:text-sm">BREAKING NEWS</h3>
                  <p className="text-white/90 text-xs sm:text-sm mt-1 line-clamp-2">{breakingNews[0]?.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowBreakingAlert(false)}
                className="text-white/60 hover:text-white text-lg sm:text-xl leading-none flex-shrink-0 ml-2"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-16 sm:pt-20 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Control Bar - Mobile Responsive */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            {/* Tab Switcher */}
            <div className="flex bg-white/5 rounded-lg p-1 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('news')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'news'
                    ? 'bg-accent-primary text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                📰 News
              </button>
              <button
                onClick={() => setActiveTab('markets')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'markets'
                    ? 'bg-accent-primary text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                📈 Markets
              </button>
            </div>

            {/* New Articles Indicator */}
            {newArticleCount > 0 && activeTab === 'news' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold flex items-center"
              >
                <Zap className="w-3 h-3 mr-1" />
                {newArticleCount} new
              </motion.div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-end">
            {/* Connection Status */}
            <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 rounded-lg text-xs ${
              isConnected 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span className="hidden sm:inline">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </div>

            {/* Manual refresh */}
            <button
              onClick={() => activeTab === 'news' ? refreshNews() : fetchMarketsData()}
              className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
              title="Refresh now"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {activeTab === 'news' ? (
            <motion.div
              key="news"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Search and Categories - Mobile Responsive */}
              <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search news articles..."
                      className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent text-white placeholder-white/40 text-sm sm:text-base"
                    />
                  </div>
                </form>

                {/* Category Tabs - Mobile Responsive */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        activeCategory === category.id
                          ? 'bg-accent-primary text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-sm sm:text-base">{category.icon}</span>
                      <span className="hidden sm:inline">{category.name}</span>
                      <span className="sm:hidden">{category.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* News Content - Mobile Responsive */}
              {newsLoading ? (
                <div className="flex items-center justify-center py-16 sm:py-20">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-accent-primary" />
                  <span className="ml-3 text-white/60 text-sm sm:text-base">Loading news...</span>
                </div>
              ) : newsError ? (
                <div className="flex items-center justify-center py-16 sm:py-20">
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                  <span className="ml-3 text-red-400 text-sm sm:text-base">{newsError}</span>
                </div>
              ) : (
                <>
                  {/* Articles Grid - Mobile Responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {articles.map((article, index) => (
                      <motion.article
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`bg-white/[0.02] border rounded-xl overflow-hidden hover:border-white/20 transition-all group relative ${
                          article.isBreaking ? 'border-red-500/50' : 'border-white/10'
                        }`}
                      >
                        {/* Breaking News Badge */}
                        {article.isBreaking && (
                          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10 bg-red-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-bold flex items-center">
                            <Zap className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                            <span className="hidden sm:inline">BREAKING</span>
                            <span className="sm:hidden">LIVE</span>
                          </div>
                        )}

                        {article.image && (
                          <div 
                            className="aspect-video overflow-hidden cursor-pointer"
                            onClick={() => openArticleReader(article, index)}
                          >
                            <img
                              src={article.image}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="p-4 sm:p-6">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded ${
                              article.isBreaking 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'bg-accent-primary/20 text-accent-primary'
                            }`}>
                              {article.source}
                            </span>
                            <div className="flex items-center text-white/40 text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatTime(article.publishedAt)}
                            </div>
                          </div>
                          
                          <h3 
                            className="text-base sm:text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-accent-primary transition-colors cursor-pointer"
                            onClick={() => openArticleReader(article, index)}
                          >
                            {article.title}
                          </h3>
                          
                          <p 
                            className="text-white/60 text-sm line-clamp-3 mb-3 sm:mb-4 cursor-pointer"
                            onClick={() => openArticleReader(article, index)}
                          >
                            {article.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openArticleReader(article, index);
                              }}
                              className="inline-flex items-center text-accent-primary hover:text-accent-primary/80 text-xs sm:text-sm font-medium transition-colors bg-accent-primary/10 hover:bg-accent-primary/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg"
                            >
                              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Read more</span>
                              <span className="sm:hidden">Read</span>
                            </button>
                            
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(article.url, '_blank', 'noopener,noreferrer');
                              }}
                              className="inline-flex items-center text-white/40 hover:text-white/60 text-sm transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-white/5"
                              title="Open original source"
                            >
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                            </a>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>

                  {/* Infinite Scroll Loading Indicator */}
                  {hasMore && (
                    <div className="flex items-center justify-center py-6 sm:py-8">
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-accent-primary" />
                      <span className="ml-3 text-white/60 text-sm sm:text-base">Loading more articles...</span>
                    </div>
                  )}

                  {/* End of Feed Indicator */}
                  {!hasMore && articles.length > 0 && (
                    <div className="flex items-center justify-center py-6 sm:py-8">
                      <div className="text-white/40 text-sm text-center">
                        📰 You've reached the end of the news feed
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="markets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {marketsLoading ? (
                <div className="flex items-center justify-center py-16 sm:py-20">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-accent-primary" />
                  <span className="ml-3 text-white/60 text-sm sm:text-base">Loading market data...</span>
                </div>
              ) : marketsError ? (
                <div className="flex items-center justify-center py-16 sm:py-20">
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                  <span className="ml-3 text-red-400 text-sm sm:text-base">{marketsError}</span>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  {/* Market Indices - Mobile Responsive */}
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center">
                      📊 Major Indices
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {marketIndices.map((index) => (
                        <div
                          key={index.symbol}
                          className="bg-white/[0.02] border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-white text-sm sm:text-base">{index.name}</h3>
                            <span className="text-white/60 text-xs sm:text-sm">{index.symbol}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg sm:text-2xl font-bold text-white">
                              ${formatCurrency(index.price)}
                            </span>
                            <div className={`flex items-center space-x-1 ${
                              index.change >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {index.change >= 0 ? (
                                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                              ) : (
                                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                              <span className="font-medium text-xs sm:text-sm">
                                {formatPercentage(index.changesPercentage)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Forex Pairs - Mobile Responsive */}
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center">
                      💱 Popular Forex Pairs
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {forexPairs.map((pair) => (
                        <div
                          key={`${pair.from}-${pair.to}`}
                          className="bg-white/[0.02] border border-white/10 rounded-xl p-4 sm:p-6 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-white text-sm sm:text-base">
                              {pair.from}/{pair.to}
                            </h3>
                          </div>
                          <div className="text-lg sm:text-2xl font-bold text-accent-primary mb-1">
                            {formatCurrency(pair.rate, pair.to === 'UGX' ? 0 : 4)}
                          </div>
                          <div className="text-white/40 text-xs">
                            Updated: {formatTime(pair.lastRefreshed)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* News Reader Modal */}
      <NewsReaderModal
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        article={selectedArticle}
        allArticles={articles}
        currentIndex={currentArticleIndex}
        onNavigate={navigateArticle}
      />
    </div>
  );
};

export default NewsAndMarkets;