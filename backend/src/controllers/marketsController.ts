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

// In-memory cache with shorter TTL for market data
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheItem>();

const MARKET_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for market data

const getCachedData = (key: string): any | null => {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < item.ttl) {
    return item.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key: string, data: any, ttl: number = MARKET_CACHE_TTL): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

// Get forex rates from Alpha Vantage
export const getForexRates = async (req: Request, res: Response) => {
  try {
    const { from = 'USD', to = 'UGX' } = req.query;
    const cacheKey = `forex_${from}_${to}`;
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        cached: true,
        ...cachedData
      });
    }

    const apiKey = process.env.ALPHA_VANTAGE_KEY;
    if (!apiKey) {
      // Return demo data if no API key
      const demoRate = getDemoForexRate(from as string, to as string);
      return res.json({
        success: true,
        demo: true,
        ...demoRate
      });
    }

    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: from,
        to_currency: to,
        apikey: apiKey
      },
      timeout: 10000
    });

    const exchangeData = response.data['Realtime Currency Exchange Rate'];
    
    if (!exchangeData) {
      return res.status(404).json({
        success: false,
        error: 'Exchange rate not found'
      });
    }

    const result = {
      from: exchangeData['1. From_Currency Code'],
      to: exchangeData['3. To_Currency Code'],
      rate: parseFloat(exchangeData['5. Exchange Rate']),
      lastRefreshed: exchangeData['6. Last Refreshed'],
      timeZone: exchangeData['7. Time Zone']
    };

    setCachedData(cacheKey, result);

    res.json({
      success: true,
      cached: false,
      ...result
    });

  } catch (error) {
    logger.error('Forex controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forex data'
    });
  }
};

// Demo forex data
const getDemoForexRate = (from: string, to: string) => {
  const demoRates: { [key: string]: number } = {
    'USD_UGX': 3750.25,
    'EUR_USD': 1.0856,
    'GBP_USD': 1.2634,
    'USD_JPY': 149.82,
    'USD_EUR': 0.9211,
    'UGX_USD': 0.000267
  };

  const key = `${from}_${to}`;
  const reverseKey = `${to}_${from}`;
  
  let rate = demoRates[key];
  if (!rate && demoRates[reverseKey]) {
    rate = 1 / demoRates[reverseKey];
  }
  if (!rate) {
    rate = 1.0; // Default rate
  }

  return {
    from,
    to,
    rate: parseFloat(rate.toFixed(4)),
    lastRefreshed: new Date().toISOString(),
    timeZone: 'UTC'
  };
};

// Get stock quote from Financial Modeling Prep
export const getStockQuote = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `stock_${symbol}`;
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        cached: true,
        ...cachedData
      });
    }

    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) {
      // Return demo data if no API key
      const demoStock = getDemoStockData(symbol);
      return res.json({
        success: true,
        demo: true,
        ...demoStock
      });
    }

    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}`,
      {
        params: { apikey: apiKey },
        timeout: 10000
      }
    );

    const stockData = response.data[0];
    
    if (!stockData) {
      return res.status(404).json({
        success: false,
        error: 'Stock symbol not found'
      });
    }

    const result = {
      symbol: stockData.symbol,
      name: stockData.name,
      price: stockData.price,
      change: stockData.change,
      changesPercentage: stockData.changesPercentage,
      dayLow: stockData.dayLow,
      dayHigh: stockData.dayHigh,
      yearHigh: stockData.yearHigh,
      yearLow: stockData.yearLow,
      marketCap: stockData.marketCap,
      volume: stockData.volume,
      avgVolume: stockData.avgVolume,
      timestamp: stockData.timestamp
    };

    setCachedData(cacheKey, result);

    res.json({
      success: true,
      cached: false,
      ...result
    });

  } catch (error) {
    logger.error('Stock controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock data'
    });
  }
};

// Demo stock data
const getDemoStockData = (symbol: string) => {
  const demoStocks: { [key: string]: any } = {
    'AAPL': {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 189.95,
      change: 2.45,
      changesPercentage: 1.31,
      dayLow: 187.50,
      dayHigh: 191.20,
      yearHigh: 199.62,
      yearLow: 164.08,
      marketCap: 2950000000000,
      volume: 45678900,
      avgVolume: 52000000
    },
    'GOOGL': {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 138.21,
      change: -1.23,
      changesPercentage: -0.88,
      dayLow: 137.80,
      dayHigh: 140.15,
      yearHigh: 151.55,
      yearLow: 83.34,
      marketCap: 1750000000000,
      volume: 28456700,
      avgVolume: 31000000
    },
    'MSFT': {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 378.85,
      change: 4.12,
      changesPercentage: 1.10,
      dayLow: 375.20,
      dayHigh: 380.50,
      yearHigh: 384.30,
      yearLow: 309.45,
      marketCap: 2820000000000,
      volume: 22345600,
      avgVolume: 25000000
    }
  };

  return demoStocks[symbol] || {
    symbol,
    name: `${symbol} Corporation`,
    price: 100.00,
    change: 0.50,
    changesPercentage: 0.50,
    dayLow: 99.00,
    dayHigh: 101.00,
    yearHigh: 120.00,
    yearLow: 80.00,
    marketCap: 50000000000,
    volume: 1000000,
    avgVolume: 1200000,
    timestamp: Date.now()
  };
};

// Get major market indices
export const getMarketIndices = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'market_indices';
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        cached: true,
        ...cachedData
      });
    }

    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) {
      // Return demo data if no API key
      const demoIndices = getDemoMarketIndices();
      return res.json({
        success: true,
        demo: true,
        indices: demoIndices
      });
    }

    const indices = ['%5EGSPC', '%5EIXIC', '%5EDJI']; // S&P 500, NASDAQ, DOW
    const promises = indices.map(symbol =>
      axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}`, {
        params: { apikey: apiKey },
        timeout: 10000
      })
    );

    const responses = await Promise.allSettled(promises);
    const results = responses
      .filter((response): response is PromiseFulfilledResult<any> => 
        response.status === 'fulfilled' && response.value.data[0]
      )
      .map(response => {
        const data = response.value.data[0];
        return {
          symbol: data.symbol,
          name: data.name,
          price: data.price,
          change: data.change,
          changesPercentage: data.changesPercentage
        };
      });

    // If no results from API, use demo data
    const finalResults = results.length > 0 ? results : getDemoMarketIndices();
    const result = { indices: finalResults };
    setCachedData(cacheKey, result);

    res.json({
      success: true,
      cached: false,
      demo: results.length === 0,
      ...result
    });

  } catch (error) {
    logger.error('Market indices controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market indices'
    });
  }
};

// Demo market indices data
const getDemoMarketIndices = () => {
  return [
    {
      symbol: '^GSPC',
      name: 'S&P 500',
      price: 4567.89,
      change: 23.45,
      changesPercentage: 0.52
    },
    {
      symbol: '^IXIC',
      name: 'NASDAQ Composite',
      price: 14234.56,
      change: -45.67,
      changesPercentage: -0.32
    },
    {
      symbol: '^DJI',
      name: 'Dow Jones Industrial Average',
      price: 34567.12,
      change: 156.78,
      changesPercentage: 0.46
    }
  ];
};

// Get popular forex pairs
export const getPopularForexPairs = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'popular_forex';
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        cached: true,
        ...cachedData
      });
    }

    const apiKey = process.env.ALPHA_VANTAGE_KEY;
    if (!apiKey) {
      // Return demo data if no API key
      const demoPairs = getDemoForexPairs();
      return res.json({
        success: true,
        demo: true,
        pairs: demoPairs
      });
    }

    const pairs = [
      { from: 'USD', to: 'UGX' },
      { from: 'EUR', to: 'USD' },
      { from: 'GBP', to: 'USD' },
      { from: 'USD', to: 'JPY' }
    ];

    const promises = pairs.map(pair =>
      axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: pair.from,
          to_currency: pair.to,
          apikey: apiKey
        },
        timeout: 10000
      }).catch(error => ({ error, pair }))
    );

    const responses = await Promise.allSettled(promises);
    const results = responses
      .filter((response): response is PromiseFulfilledResult<any> => 
        response.status === 'fulfilled' && 
        !response.value.error &&
        response.value.data['Realtime Currency Exchange Rate']
      )
      .map(response => {
        const exchangeData = response.value.data['Realtime Currency Exchange Rate'];
        return {
          from: exchangeData['1. From_Currency Code'],
          to: exchangeData['3. To_Currency Code'],
          rate: parseFloat(exchangeData['5. Exchange Rate']),
          lastRefreshed: exchangeData['6. Last Refreshed']
        };
      });

    // If no results from API, use demo data
    const finalResults = results.length > 0 ? results : getDemoForexPairs();
    const result = { pairs: finalResults };
    setCachedData(cacheKey, result);

    res.json({
      success: true,
      cached: false,
      demo: results.length === 0,
      ...result
    });

  } catch (error) {
    console.error('Popular forex controller error:', error);
    // Return demo data on error
    const demoPairs = getDemoForexPairs();
    res.json({
      success: true,
      demo: true,
      pairs: demoPairs
    });
  }
};

// Demo forex pairs data
const getDemoForexPairs = () => {
  return [
    {
      from: 'USD',
      to: 'UGX',
      rate: 3750.25,
      lastRefreshed: new Date().toISOString()
    },
    {
      from: 'EUR',
      to: 'USD',
      rate: 1.0856,
      lastRefreshed: new Date().toISOString()
    },
    {
      from: 'GBP',
      to: 'USD',
      rate: 1.2634,
      lastRefreshed: new Date().toISOString()
    },
    {
      from: 'USD',
      to: 'JPY',
      rate: 149.82,
      lastRefreshed: new Date().toISOString()
    }
  ];
};