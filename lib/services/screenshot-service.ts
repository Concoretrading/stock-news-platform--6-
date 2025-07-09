import { getFirestore, getStorage } from '@/lib/firebase-admin';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Helper function to get database safely
async function getDatabase() {
  return await getFirestore();
}

// Helper function to get storage safely
async function getStorageInstance() {
  return await getStorage();
}

// Initialize Vision API client
let vision: ImageAnnotatorClient | null = null;

function getVisionClient() {
  if (!vision) {
    try {
      console.log('🔄 Initializing Google Vision API client...');
      
      // Try environment variable with JSON content first (for Vercel/production)
      const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
      if (credentialsJson) {
        console.log('🔧 Using GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable');
        const credentials = JSON.parse(credentialsJson);
        console.log('🔧 Project ID:', credentials.project_id);
        
        vision = new ImageAnnotatorClient({
          credentials: credentials,
          projectId: credentials.project_id
        });
        console.log('✅ Google Vision API initialized with environment credentials');
      } else {
        // Try reading credentials file directly (for local development)
        const fs = require('fs');
        const path = require('path');
        const credentialsPath = path.join(process.cwd(), 'concorenews-firebase-adminsdk.json');
        
        if (fs.existsSync(credentialsPath)) {
          const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
          console.log('📁 Using credentials file:', credentialsPath);
          console.log('🔧 Project ID:', credentials.project_id);
          
          vision = new ImageAnnotatorClient({
            credentials: credentials,
            projectId: credentials.project_id
          });
          console.log('✅ Google Vision API initialized with credentials file');
        } else {
          console.log('❌ No credentials found');
          console.log('❌ GOOGLE_APPLICATION_CREDENTIALS_JSON not set');
          console.log('❌ Credentials file not found at:', credentialsPath);
          
          // Fall back to environment variable file path
          const credentialsEnvPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
          if (credentialsEnvPath) {
            console.log('🔧 Using GOOGLE_APPLICATION_CREDENTIALS env var:', credentialsEnvPath);
            vision = new ImageAnnotatorClient({
              keyFilename: credentialsEnvPath
            });
            console.log('✅ Google Vision API initialized with environment variable file');
          } else {
            console.log('❌ GOOGLE_APPLICATION_CREDENTIALS not set');
            throw new Error('Google Vision API credentials not found. Please check your setup.');
          }
        }
      }
      
      // Test the client with a simple call to verify it works
      console.log('🧪 Testing Vision API client...');
      
    } catch (error) {
      console.error('❌ Failed to initialize Vision client:', error);
      console.error('📋 Error details:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error(`Google Vision API is not properly configured: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  return vision;
}

interface NewsEntryResult {
  ticker: string;
  success: boolean;
  id?: string;
  error?: string;
}

interface ScreenshotAnalysis {
  userId: string;
  imageStoragePath: string;
  imageUrl: string;
  detectedText: string;
  matches: string[];
  headline: string;
  date: string;
  price: number | null;
  source: string;
  createdAt: string;
}

interface NewsEntry {
  userId: string;
  ticker: string;
  headline: string;
  date: string;
  price: number | null;
  source: string;
  imageUrl: string;
  type: 'screenshot';
  createdAt: string;
}

interface AnalyzeScreenshotResult {
  matches: string[];
  extractedText: string;
  headline: string;
  date: string;
  price: number | null;
  source: string;
  imageStoragePath: string;
  newsEntryResults?: NewsEntryResult[];
  message: string;
}

// Common stock tickers to look for
const COMMON_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC',
  'UBER', 'LYFT', 'SHOP', 'SPOT', 'SNOW', 'PLTR', 'RBLX', 'COIN', 'HOOD', 'SOFI',
  'DDOG', 'ADBE', 'WDAY', 'MDB', 'NOW', 'VEEV', 'CRWD', 'ZM', 'DOCU', 'OKTA',
  'TWLO', 'TEAM', 'SPLK', 'WDAY', 'PANW', 'FTNT', 'CHKP', 'CYBR', 'ZSCL', 'SAIL'
];

export async function getWatchlistTickers(userId: string): Promise<string[]> {
  try {
    const db = await getDatabase();
    
    console.log('🔍 Fetching watchlist tickers for user:', userId);
    
    const stocksSnap = await db.collection('stocks')
      .where('userId', '==', userId)
      .get();

    const tickers = stocksSnap.docs.map(doc => doc.data().ticker);
    console.log('🔍 Found watchlist tickers:', tickers);
    
    return tickers;
  } catch (error) {
    console.error('Error fetching watchlist tickers:', error);
    // Return empty array during build time when Firebase isn't available
    if (error instanceof Error && error.message.includes('Firebase admin not initialized')) {
      return [];
    }
    throw error;
  }
}

// Extract stock tickers from text
function extractTickersFromText(text: string, userWatchlistTickers: string[] = []): string[] {
  // Look for patterns like $AAPL, TSLA, etc.
  const patterns = [
    /\$([A-Z]{1,5})\b/g,  // $AAPL format
    /\b([A-Z]{2,5})\b/g,  // AAPL format (2-5 letters)
  ];
  
  const found = new Set<string>();
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const ticker = match.replace('$', '').toUpperCase();
        
        // First check if it's in user's watchlist (highest priority)
        if (userWatchlistTickers.includes(ticker)) {
          found.add(ticker);
          return;
        }
        
        // Then check common tickers as fallback
        if (COMMON_TICKERS.includes(ticker)) {
          found.add(ticker);
          return;
        }
        
        // Finally, include any valid-looking ticker (2-5 uppercase letters)
        // but exclude common English words that might be false positives
        const excludeWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'HAD', 'HAS', 'HAVE', 'WILL', 'NEW', 'OLD', 'GET', 'SET', 'PUT', 'USE', 'WAY', 'MAY', 'SAY', 'SEE', 'HIM', 'TWO', 'HOW', 'ITS', 'WHO', 'OIL', 'SIT', 'NOW', 'TOP', 'LET', 'RUN', 'OFF', 'END', 'WHY', 'TOO', 'BAD', 'BIG', 'FAR', 'FEW', 'LOT', 'MAN', 'ACT', 'GOT', 'BAD', 'BOY', 'DID', 'GOD', 'ASK', 'YES', 'TRY', 'OWN', 'AGO', 'EAR', 'EYE', 'ARM', 'LAW', 'SUN', 'TAX', 'AIR', 'WIN', 'CUT', 'RED', 'JOB', 'AGE', 'ADD', 'KEY', 'PER', 'ANY', 'CAR', 'BAR', 'BOX', 'BED', 'EAT', 'FUN', 'GUN', 'HAT', 'ICE', 'MAP', 'NET', 'PEN', 'SEX', 'SKY', 'SUN', 'WAR', 'WEB', 'WIN', 'ART', 'BIT', 'COP', 'DOG', 'DUE', 'FAN', 'FIT', 'GAS', 'HIT', 'HOT', 'LAY', 'LEG', 'LIP', 'MIX', 'MOM', 'POP', 'RAW', 'RUN', 'SAD', 'SEA', 'SIX', 'TAB', 'TEA', 'TEN', 'TIP', 'TOP', 'TOY', 'VIA', 'WET', 'ZIP'];
        
        if (ticker.length >= 2 && ticker.length <= 5 && !excludeWords.includes(ticker)) {
          // Additional validation: check if it looks like a stock ticker
          // Stock tickers usually don't have common patterns like consecutive vowels
          if (!/[AEIOU]{3,}/.test(ticker) && !/[^A-Z]/.test(ticker)) {
            found.add(ticker);
          }
        }
      });
    }
  });
  
  return Array.from(found);
}

// Extract headline from text
function extractHeadline(text: string): string {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Look for the first substantial line that might be a headline
  for (const line of lines) {
    if (line.trim().length > 10 && line.trim().length < 200) {
      return line.trim();
    }
  }
  
  return 'News from Screenshot';
}

// Extract date from text
function extractDate(text: string): string {
  const datePatterns = [
    /\d{1,2}\/\d{1,2}\/\d{4}/,  // MM/DD/YYYY
    /\d{4}-\d{2}-\d{2}/,        // YYYY-MM-DD
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i,  // Month DD, YYYY
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStr = match[0];
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.log('Failed to parse date:', dateStr);
      }
    }
  }
  
  return new Date().toISOString().split('T')[0];
}

// Extract price from text
function extractPrice(text: string): number | null {
  const pricePatterns = [
    /\$(\d+\.?\d*)/g,  // $123.45
    /(\d+\.?\d*)\s*dollars?/gi,  // 123.45 dollars
  ];
  
  for (const pattern of pricePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const price = parseFloat(match.replace(/[^\d.]/g, ''));
        if (!isNaN(price) && price > 0 && price < 10000) {
          return price;
        }
      }
    }
  }
  
  return null;
}

export async function analyzeScreenshot(userId: string, imageBuffer: Buffer, imageType: string): Promise<AnalyzeScreenshotResult> {
  try {
    console.log('🔄 Starting screenshot analysis for user:', userId);
    
    const db = await getDatabase();
    const storage = await getStorageInstance();
    
    console.log('🔧 Initializing Vision API client...');
    const visionClient = getVisionClient();
    console.log('✅ Vision API client ready');
    
    // Get user's watchlist
    console.log('🔍 Fetching user watchlist...');
    const userWatchlistTickers = await getWatchlistTickers(userId);
    console.log('📋 User watchlist:', userWatchlistTickers);
    
    // Analyze image with Google Vision API
    console.log('👁️ Analyzing image with Google Vision API...');
    const [result] = await visionClient.textDetection({
      image: { content: imageBuffer }
    });
    console.log('📝 Vision API analysis complete');
    
    const detectedText = result.textAnnotations?.[0]?.description || '';
    console.log('📄 Detected text length:', detectedText.length);
    console.log('📄 Detected text preview:', detectedText.substring(0, 200));
    
    if (!detectedText) {
      throw new Error('No text detected in the image');
    }
    
    // Extract information from text
    const extractedTickers = extractTickersFromText(detectedText, userWatchlistTickers);
    const headline = extractHeadline(detectedText);
    const date = extractDate(detectedText);
    const price = extractPrice(detectedText);
    
    console.log('🎯 Extracted tickers:', extractedTickers);
    console.log('📰 Headline:', headline);
    console.log('📅 Date:', date);
    console.log('💰 Price:', price);
    
    // Filter tickers to only include those in user's watchlist
    const matchedTickers = extractedTickers.filter(ticker => 
      userWatchlistTickers.includes(ticker.toUpperCase())
    );
    
    console.log('✅ Matched tickers in watchlist:', matchedTickers);
    
    // Upload image to storage for user reference
    console.log('☁️ Uploading image to Firebase Storage...');
    const timestamp = Date.now();
    const imageStoragePath = `screenshots/${userId}/${timestamp}_screenshot.jpg`;
    const bucket = storage.bucket();
    const file = bucket.file(imageStoragePath);
    
    await file.save(imageBuffer, {
      metadata: {
        contentType: imageType,
      },
    });
    
    // Make the file publicly accessible
    await file.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${imageStoragePath}`;
    
    console.log('🔗 Image uploaded to:', imageUrl);
    
    // Create catalyst entries for matched tickers
    console.log('💾 Creating catalyst entries...');
    const newsEntryResults: NewsEntryResult[] = [];
    
    for (const ticker of matchedTickers) {
      try {
        const catalystData = {
          userId,
          stockTickers: [ticker.toUpperCase()],
          title: headline,
          description: `Screenshot analysis result:\n\n${detectedText.substring(0, 500)}`,
          date: date,
          imageUrl: imageUrl,
          isManual: false,
          createdAt: new Date().toISOString(),
          priceBefore: price,
          priceAfter: null,
          source: 'Screenshot Analysis',
        };
        
        console.log(`💾 Saving catalyst for ${ticker}:`, catalystData);
        const docRef = await db.collection('catalysts').add(catalystData);
        
        newsEntryResults.push({
          ticker: ticker.toUpperCase(),
          success: true,
          id: docRef.id,
        });
        
        console.log(`✅ Created catalyst entry for ${ticker}:`, docRef.id);
      } catch (error) {
        console.error(`❌ Error creating catalyst for ${ticker}:`, error);
        newsEntryResults.push({
          ticker: ticker.toUpperCase(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    const successCount = newsEntryResults.filter(r => r.success).length;
    const message = successCount > 0 
      ? `Successfully created ${successCount} catalyst entries`
      : 'No matching stocks found in your watchlist';
    
    console.log('🎉 Screenshot analysis complete:', message);
    
    return {
      matches: matchedTickers,
      extractedText: detectedText,
      headline,
      date,
      price,
      source: 'Screenshot Analysis',
      imageStoragePath,
      newsEntryResults,
      message,
    };
    
  } catch (error) {
    console.error('❌ Error analyzing screenshot:', error);
    console.error('📋 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
} 