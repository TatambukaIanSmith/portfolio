import { Request, Response } from 'express';
import axios from 'axios';

// Simple console logger to avoid winston issues
const logger = {
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  }
};

// In-memory cache with 5-minute TTL
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheItem>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache helper functions
const getCachedData = (key: string): any | null => {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < item.ttl) {
    return item.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key: string, data: any, ttl: number = CACHE_TTL): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

// Normalize article format across different APIs
const normalizeArticle = (article: any, source: string) => {
  return {
    title: article.title || 'No title',
    description: article.description || article.content || 'No description available',
    source: article.source?.name || source,
    image: article.urlToImage || article.image || null,
    url: article.url,
    publishedAt: article.publishedAt || article.published_at || new Date().toISOString(),
    category: article.category || 'general'
  };
};

// Get news from NewsAPI
const getNewsAPIData = async (category: string, search?: string, page: number = 1) => {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    // Return demo data if no API key
    return getDemoNewsData(category, search, page);
  }

  const baseUrl = search 
    ? 'https://newsapi.org/v2/everything'
    : 'https://newsapi.org/v2/top-headlines';

  const params: any = {
    apiKey,
    page,
    pageSize: 20,
    language: 'en'
  };

  if (search) {
    params.q = search;
    // Add specific sources for comprehensive coverage
    params.sources = 'bbc-news,cnn,national-geographic,espn,sky-sports,the-guardian,reuters,associated-press';
  } else {
    // Map our extended categories to NewsAPI categories
    const categoryMap: { [key: string]: string } = {
      'general': 'general',
      'business': 'business',
      'technology': 'technology',
      'sports': 'sports',
      'health': 'health',
      'science': 'science',
      'entertainment': 'entertainment',
      'music': 'entertainment',
      'tourism': 'general',
      'fashion': 'general',
      'food': 'general',
      'animals': 'science',
      'environment': 'science'
    };
    
    params.category = categoryMap[category] || 'general';
    params.country = 'us';
    
    // Add specific sources for better coverage
    if (category === 'sports') {
      params.sources = 'espn,bbc-sport,sky-sports,fox-sports';
    } else if (category === 'animals' || category === 'environment') {
      params.sources = 'national-geographic,bbc-news';
    } else if (category === 'tourism') {
      params.sources = 'national-geographic,bbc-news,cnn';
    }
  }

  const response = await axios.get(baseUrl, { 
    params,
    timeout: 10000 
  });

  return {
    articles: response.data.articles.map((article: any) => 
      normalizeArticle(article, 'NewsAPI')
    ),
    totalResults: response.data.totalResults
  };
};

// Demo data for when API keys are not available
const getDemoNewsData = (category: string, search?: string, page: number = 1) => {
  // Generate current year news with daily rotation
  const currentYear = new Date().getFullYear(); // 2026
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(currentYear, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // Use day of year to rotate news content
  const newsRotation = dayOfYear % 7; // 7-day rotation cycle
  
  const generateTimestamp = (hoursAgo: number) => {
    return new Date(Date.now() - (hoursAgo * 60 * 60 * 1000)).toISOString();
  };

  const demoArticles = [
    // Technology & Innovation
    {
      title: `${currentYear} AI Revolution: Breakthrough Changes Everything`,
      description: `Scientists in ${currentYear} unveil groundbreaking artificial intelligence system that can solve complex problems faster than ever before, promising to revolutionize industries worldwide this year.`,
      source: { name: "TechCrunch" },
      urlToImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
      url: "#tech-ai-breakthrough-2026",
      publishedAt: generateTimestamp(1 + newsRotation),
      category: "technology"
    },
    {
      title: `Space Innovation ${currentYear}: New Mars Mission Launched Today`,
      description: `NASA's latest ${currentYear} Mars exploration mission features cutting-edge technology designed to search for signs of ancient life and prepare for human exploration within the next decade.`,
      source: { name: "NASA News" },
      urlToImage: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=400&fit=crop",
      url: "#space-mars-mission-2026",
      publishedAt: generateTimestamp(2 + newsRotation),
      category: "science"
    },

    // Sports & Football Transfer News
    {
      title: `🚨 BREAKING ${currentYear}: Mbappé's Shocking Move - Here We Go!`,
      description: `Fabrizio Romano confirms: Major transfer shock in ${currentYear}! Kylian Mbappé makes unexpected career decision. Medical scheduled for this week. The football world is stunned! ⚪️👑`,
      source: { name: "Fabrizio Romano" },
      urlToImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop",
      url: "#mbappe-transfer-2026",
      publishedAt: generateTimestamp(3 + newsRotation),
      category: "sports"
    },
    {
      title: `Champions League ${currentYear}: Historic Final This Weekend`,
      description: `Two football giants prepare for the ultimate battle in European football ${currentYear}. This year's final promises to be the most watched sporting event globally with revolutionary broadcast technology.`,
      source: { name: "UEFA" },
      urlToImage: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=400&fit=crop",
      url: "#champions-league-final-2026",
      publishedAt: generateTimestamp(4 + newsRotation),
      category: "sports"
    },
    {
      title: `Premier League ${currentYear}: Record-Breaking Transfer Window`,
      description: `English clubs shatter all previous spending records in ${currentYear} with unprecedented £2 billion transfer window. Revolutionary player contracts include AI performance bonuses.`,
      source: { name: "Sky Sports" },
      urlToImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop",
      url: "#premier-league-transfers-2026",
      publishedAt: generateTimestamp(5 + newsRotation),
      category: "sports"
    },

    // Tourism & Travel
    {
      title: `${currentYear} Travel Revolution: 10 Undiscovered Destinations`,
      description: `Explore breathtaking locations around the world in ${currentYear} that remain untouched by mass tourism. From secret beaches to mountain hideaways, this year's travel trends focus on sustainability.`,
      source: { name: "National Geographic" },
      urlToImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
      url: "#hidden-paradise-destinations-2026",
      publishedAt: generateTimestamp(6 + newsRotation),
      category: "tourism"
    },
    {
      title: `Sustainable Tourism ${currentYear}: Eco-Friendly Travel Dominates`,
      description: `The future of travel in ${currentYear} focuses on environmental responsibility with carbon-neutral flights and eco-luxury resorts leading the global tourism revolution.`,
      source: { name: "Travel + Leisure" },
      urlToImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop",
      url: "#sustainable-tourism-2026",
      publishedAt: generateTimestamp(7 + newsRotation),
      category: "tourism"
    },

    // Fashion & Lifestyle
    {
      title: `Paris Fashion Week ${currentYear}: Revolutionary Sustainable Designs`,
      description: `Top designers showcase eco-friendly collections in ${currentYear} made from revolutionary bio-materials, setting new standards for the fashion industry's environmental impact.`,
      source: { name: "Vogue" },
      urlToImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=400&fit=crop",
      url: "#paris-fashion-week-sustainable-2026",
      publishedAt: generateTimestamp(8 + newsRotation),
      category: "fashion"
    },

    // Food & Culinary
    {
      title: `Michelin Stars ${currentYear}: New Culinary Capitals Emerge`,
      description: `This year's ${currentYear} Michelin Guide reveals surprising new destinations for food lovers, with African and Asian cuisines gaining unprecedented recognition in the global culinary scene.`,
      source: { name: "Michelin Guide" },
      urlToImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop",
      url: "#michelin-stars-2026",
      publishedAt: generateTimestamp(9 + newsRotation),
      category: "food"
    },
    {
      title: `Plant-Based Revolution ${currentYear}: Lab-Grown Meat Goes Mainstream`,
      description: `Major food chains worldwide in ${currentYear} adopt laboratory-grown meat alternatives, promising to reduce environmental impact by 90% while maintaining superior taste and nutrition.`,
      source: { name: "Food & Wine" },
      urlToImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop",
      url: "#plant-based-revolution-2026",
      publishedAt: generateTimestamp(10 + newsRotation),
      category: "food"
    },

    // Music & Entertainment
    {
      title: `Global Music Festival Season ${currentYear}: AI-Generated Concerts`,
      description: `Revolutionary technology in ${currentYear} allows deceased music legends to 'perform' alongside living artists in groundbreaking holographic concerts that sell out worldwide.`,
      source: { name: "Rolling Stone" },
      urlToImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
      url: "#ai-generated-concerts-2026",
      publishedAt: generateTimestamp(11 + newsRotation),
      category: "music"
    },

    // Wildlife & Nature
    {
      title: `Ocean Discovery ${currentYear}: New Deep-Sea Species Found`,
      description: `Marine biologists in ${currentYear} discover dozens of previously unknown species in the deepest parts of the Pacific Ocean, including bioluminescent creatures that could revolutionize medicine.`,
      source: { name: "National Geographic" },
      urlToImage: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop",
      url: "#ocean-discovery-species-2026",
      publishedAt: generateTimestamp(12 + newsRotation),
      category: "animals"
    },
    {
      title: `African Safari ${currentYear}: Conservation Success Stories`,
      description: `Wildlife populations in East Africa show remarkable recovery in ${currentYear} thanks to innovative AI-powered conservation programs and unprecedented community involvement.`,
      source: { name: "BBC Wildlife" },
      urlToImage: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=400&fit=crop",
      url: "#african-safari-conservation-2026",
      publishedAt: generateTimestamp(13 + newsRotation),
      category: "animals"
    },

    // Water & Environment
    {
      title: `Water Crisis Solution ${currentYear}: Revolutionary Desalination Technology`,
      description: `Scientists in ${currentYear} develop energy-efficient desalination process that could provide clean water to millions while protecting marine ecosystems using solar-powered systems.`,
      source: { name: "Scientific American" },
      urlToImage: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=400&fit=crop",
      url: "#water-crisis-solution-2026",
      publishedAt: generateTimestamp(14 + newsRotation),
      category: "environment"
    },

    // Continental News
    {
      title: `Antarctica Research ${currentYear}: Climate Change Accelerating`,
      description: `Latest research from Antarctica in ${currentYear} reveals ice sheet melting faster than predicted, with global implications for sea level rise affecting coastal cities worldwide.`,
      source: { name: "Climate Central" },
      urlToImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop",
      url: "#antarctica-climate-research-2026",
      publishedAt: generateTimestamp(15 + newsRotation),
      category: "science"
    },

    // Business & Markets
    {
      title: `Global Markets ${currentYear}: Tech Innovation Drives Surge`,
      description: `Stock markets worldwide experience significant gains in ${currentYear} as investors show unprecedented confidence in emerging technologies and sustainable energy solutions.`,
      source: { name: "Bloomberg" },
      urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
      url: "#global-markets-surge-2026",
      publishedAt: generateTimestamp(16 + newsRotation),
      category: "business"
    },

    // Health & Medical
    {
      title: `Medical Breakthrough ${currentYear}: Gene Therapy Success`,
      description: `Revolutionary gene therapy treatment in ${currentYear} shows promising results in clinical trials, offering hope for previously incurable genetic diseases affecting millions globally.`,
      source: { name: "Medical News Today" },
      urlToImage: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop",
      url: "#gene-therapy-breakthrough-2026",
      publishedAt: generateTimestamp(17 + newsRotation),
      category: "health"
    }
  ];

  // Filter by category if specified
  let filteredArticles = demoArticles;
  if (category !== 'general') {
    filteredArticles = demoArticles.filter(article => article.category === category);
  }

  // Filter by search if specified
  if (search) {
    filteredArticles = filteredArticles.filter(article => 
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  return {
    articles: filteredArticles.map(article => normalizeArticle(article, 'Demo')),
    totalResults: filteredArticles.length
  };
};

// Get news from GNews as fallback
const getGNewsData = async (category: string, search?: string, page: number = 1) => {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    // Return empty if no API key (NewsAPI demo data will be used)
    return { articles: [], totalResults: 0 };
  }

  const params: any = {
    token: apiKey,
    lang: 'en',
    country: 'us',
    max: 20,
    page
  };

  if (search) {
    params.q = search;
  } else if (category !== 'general') {
    params.category = category;
  }

  const response = await axios.get('https://gnews.io/api/v4/top-headlines', {
    params,
    timeout: 10000
  });

  return {
    articles: response.data.articles.map((article: any) => 
      normalizeArticle(article, 'GNews')
    ),
    totalResults: response.data.totalArticles || response.data.articles.length
  };
};

// Deduplicate articles by title similarity
const deduplicateArticles = (articles: any[]) => {
  const seen = new Set();
  return articles.filter(article => {
    const key = article.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const getNews = async (req: Request, res: Response) => {
  try {
    const { 
      category = 'general', 
      search, 
      page = 1 
    } = req.query;

    const cacheKey = `news_${category}_${search || 'none'}_${page}`;
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        cached: true,
        ...cachedData
      });
    }

    let allArticles: any[] = [];
    let totalResults = 0;
    let hasApiKeys = false;

    // Check if we have API keys
    const hasNewsAPI = !!process.env.NEWSAPI_KEY;
    const hasGNewsAPI = !!process.env.GNEWS_API_KEY;

    if (hasNewsAPI || hasGNewsAPI) {
      hasApiKeys = true;
      
      try {
        // Try NewsAPI first
        if (hasNewsAPI) {
          const newsApiData = await getNewsAPIData(
            category as string, 
            search as string, 
            parseInt(page as string)
          );
          allArticles.push(...newsApiData.articles);
          totalResults = newsApiData.totalResults;
        }
      } catch (error) {
        console.log('NewsAPI failed:', error);
      }

      try {
        // Try GNews as fallback/supplement
        if (hasGNewsAPI) {
          const gNewsData = await getGNewsData(
            category as string, 
            search as string, 
            parseInt(page as string)
          );
          allArticles.push(...gNewsData.articles);
          if (totalResults === 0) totalResults = gNewsData.totalResults;
        }
      } catch (error) {
        console.log('GNews failed:', error);
      }
    }

    // If no API keys or all APIs failed, use demo data
    if (!hasApiKeys || allArticles.length === 0) {
      console.log('Using demo news data');
      const demoData = getDemoNewsData(
        category as string, 
        search as string, 
        parseInt(page as string)
      );
      allArticles = demoData.articles;
      totalResults = demoData.totalResults;
    }

    // Deduplicate and sort by date
    const uniqueArticles = deduplicateArticles(allArticles)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 20);

    const result = {
      totalResults: Math.max(totalResults, uniqueArticles.length),
      articles: uniqueArticles,
      page: parseInt(page as string),
      category: category as string,
      demo: !hasApiKeys
    };

    // Cache the result
    setCachedData(cacheKey, result);

    res.json({
      success: true,
      cached: false,
      ...result
    });

  } catch (error) {
    console.error('News controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news data'
    });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  const categories = [
    { id: 'general', name: 'General', icon: '🌍' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'sports', name: 'Sports & Football', icon: '⚽' },
    { id: 'health', name: 'Health & Medical', icon: '🏥' },
    { id: 'science', name: 'Science & Innovation', icon: '🔬' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎭' },
    { id: 'music', name: 'Music & Arts', icon: '🎵' },
    { id: 'tourism', name: 'Tourism & Travel', icon: '✈️' },
    { id: 'fashion', name: 'Fashion & Style', icon: '👗' },
    { id: 'food', name: 'Food & Culinary', icon: '🍽️' },
    { id: 'animals', name: 'Wildlife & Nature', icon: '🦁' },
    { id: 'environment', name: 'Water & Environment', icon: '💧' }
  ];

  res.json({
    success: true,
    categories
  });
};