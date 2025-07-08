import { getFirestore } from '@/lib/firebase-admin';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { getStorage } from '@/lib/firebase-admin';

// Helper function to get database safely
async function getDatabase() {
  return await getFirestore();
}

const vision = new ImageAnnotatorClient();

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

export async function getWatchlistTickers(userId: string): Promise<string[]> {
  try {
    const db = await getDatabase();
    const stocksSnap = await db.collection('stocks')
      .where('userId', '==', userId)
      .get();

    return stocksSnap.docs.map(doc => doc.data().ticker);
  } catch (error) {
    console.error('Error fetching watchlist tickers:', error);
    // Return empty array during build time when Firebase isn't available
    if (error instanceof Error && error.message.includes('Firebase admin not initialized')) {
      return [];
    }
    throw error;
  }
}

export async function analyzeScreenshot(userId: string, imageBuffer: Buffer, imageType: string) {
  try {
    const db = await getDatabase();
    
    // Simple mock screenshot analysis
    const result = {
      extractedText: 'Mock extracted text from screenshot',
      matches: [
        {
          ticker: 'AAPL',
          company: 'Apple Inc.',
          confidence: 0.95
        }
      ],
      headline: 'Screenshot Analysis Result',
      date: new Date().toISOString().split('T')[0],
      price: null,
      source: 'Screenshot Analysis',
      imageStoragePath: 'screenshots/mock-path.jpg',
      newsEntryResults: [
        {
          ticker: 'AAPL',
          success: true,
          id: 'mock-id'
        }
      ],
      message: 'Screenshot analysis completed (mock)'
    };
    
    return result;
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    throw error;
  }
} 