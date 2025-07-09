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
      // Try reading credentials file directly
      const fs = require('fs');
      const path = require('path');
      const credentialsPath = path.join(process.cwd(), 'concorenews-firebase-adminsdk.json');
      
      if (fs.existsSync(credentialsPath)) {
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        vision = new ImageAnnotatorClient({
          credentials: credentials,
          projectId: credentials.project_id
        });
        console.log('✅ Google Vision API initialized with credentials file');
      } else {
        // Fall back to environment variable
        const credentialsEnvPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (credentialsEnvPath) {
          vision = new ImageAnnotatorClient({
            keyFilename: credentialsEnvPath
          });
        } else {
          // Fall back to default credentials
          vision = new ImageAnnotatorClient();
        }
      }
    } catch (error) {
      console.error('Failed to initialize Vision client:', error);
      throw new Error('Google Vision API is not properly configured');
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
function extractTickersFromText(text: string): string[] {
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
        if (COMMON_TICKERS.includes(ticker)) {
          found.add(ticker);
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
    console.log('Starting screenshot analysis for user:', userId);
    
    const db = await getDatabase();
    const storage = await getStorageInstance();
    const visionClient = getVisionClient();
    
    // Get user's watchlist
    const watchlistTickers = await getWatchlistTickers(userId);
    console.log('User watchlist:', watchlistTickers);
    
    // Analyze image with Google Vision API
    const [result] = await visionClient.textDetection({
      image: { content: imageBuffer }
    });
    
    const detectedText = result.textAnnotations?.[0]?.description || '';
    console.log('Detected text:', detectedText);
    
    if (!detectedText) {
      throw new Error('No text detected in the image');
    }
    
    // Extract information from text
    const extractedTickers = extractTickersFromText(detectedText);
    const headline = extractHeadline(detectedText);
    const date = extractDate(detectedText);
    const price = extractPrice(detectedText);
    
    console.log('Extracted tickers:', extractedTickers);
    console.log('Headline:', headline);
    console.log('Date:', date);
    console.log('Price:', price);
    
    // Filter tickers to only include those in user's watchlist
    const matchedTickers = extractedTickers.filter(ticker => 
      watchlistTickers.includes(ticker.toUpperCase())
    );
    
    console.log('Matched tickers in watchlist:', matchedTickers);
    
    // Upload image to storage for user reference
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
    
    console.log('Image uploaded to:', imageUrl);
    
    // Create catalyst entries for matched tickers
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
        
        const docRef = await db.collection('catalysts').add(catalystData);
        
        newsEntryResults.push({
          ticker: ticker.toUpperCase(),
          success: true,
          id: docRef.id,
        });
        
        console.log(`Created catalyst entry for ${ticker}:`, docRef.id);
      } catch (error) {
        console.error(`Error creating catalyst for ${ticker}:`, error);
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
    console.error('Error analyzing screenshot:', error);
    throw error;
  }
} 