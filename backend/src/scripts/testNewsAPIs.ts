import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Test script to verify all News & Markets API keys work
async function testAllAPIs() {
  console.log('🧪 Testing News & Markets API Keys...\n');

  // Test NewsAPI
  console.log('1️⃣ Testing NewsAPI...');
  try {
    if (!process.env.NEWSAPI_KEY) {
      console.log('❌ NEWSAPI_KEY not found in .env');
    } else {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          apiKey: process.env.NEWSAPI_KEY,
          country: 'us',
          pageSize: 5
        },
        timeout: 10000
      });
      console.log(`✅ NewsAPI: ${response.data.totalResults} articles available`);
      console.log(`   Sample: "${response.data.articles[0]?.title}"`);
    }
  } catch (error: any) {
    console.log(`❌ NewsAPI Error: ${error.response?.data?.message || error.message}`);
  }

  console.log('');

  // Test GNews
  console.log('2️⃣ Testing GNews API...');
  try {
    if (!process.env.GNEWS_API_KEY) {
      console.log('❌ GNEWS_API_KEY not found in .env');
    } else {
      const response = await axios.get('https://gnews.io/api/v4/top-headlines', {
        params: {
          token: process.env.GNEWS_API_KEY,
          lang: 'en',
          country: 'us',
          max: 5
        },
        timeout: 10000
      });
      console.log(`✅ GNews: ${response.data.totalArticles} articles available`);
      console.log(`   Sample: "${response.data.articles[0]?.title}"`);
    }
  } catch (error: any) {
    console.log(`❌ GNews Error: ${error.response?.data?.message || error.message}`);
  }

  console.log('');

  // Test Alpha Vantage
  console.log('3️⃣ Testing Alpha Vantage API...');
  try {
    if (!process.env.ALPHA_VANTAGE_KEY) {
      console.log('❌ ALPHA_VANTAGE_KEY not found in .env');
    } else {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: 'USD',
          to_currency: 'EUR',
          apikey: process.env.ALPHA_VANTAGE_KEY
        },
        timeout: 10000
      });
      
      const exchangeData = response.data['Realtime Currency Exchange Rate'];
      if (exchangeData) {
        console.log(`✅ Alpha Vantage: USD/EUR = ${exchangeData['5. Exchange Rate']}`);
      } else {
        console.log(`❌ Alpha Vantage: Invalid response - ${JSON.stringify(response.data)}`);
      }
    }
  } catch (error: any) {
    console.log(`❌ Alpha Vantage Error: ${error.response?.data?.message || error.message}`);
  }

  console.log('');

  // Test Financial Modeling Prep
  console.log('4️⃣ Testing Financial Modeling Prep API...');
  try {
    if (!process.env.FMP_API_KEY) {
      console.log('❌ FMP_API_KEY not found in .env');
    } else {
      const response = await axios.get('https://financialmodelingprep.com/api/v3/quote/AAPL', {
        params: {
          apikey: process.env.FMP_API_KEY
        },
        timeout: 10000
      });
      
      if (response.data && response.data[0]) {
        const stock = response.data[0];
        console.log(`✅ Financial Modeling Prep: AAPL = $${stock.price} (${stock.changesPercentage}%)`);
      } else {
        console.log(`❌ Financial Modeling Prep: Invalid response`);
      }
    }
  } catch (error: any) {
    console.log(`❌ Financial Modeling Prep Error: ${error.response?.data?.message || error.message}`);
  }

  console.log('\n🎉 API Testing Complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. Fix any failed API keys above');
  console.log('2. Restart your server: npm run dev-simple');
  console.log('3. Visit: http://localhost:3000 → News & Markets');
}

// Run the test
testAllAPIs().catch(console.error);