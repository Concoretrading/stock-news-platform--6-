import { getFirestore } from 'firebase-admin/firestore';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { getStorage } from '@/lib/firebase-admin';

const db = getFirestore();
const vision = new ImageAnnotatorClient();
const storage = getStorage();
const bucket = storage.bucket();

export async function getWatchlistTickers(userId: string) {
  try {
    const stocksSnap = await db.collection('stocks')
      .where('userId', '==', userId)
      .get();

    return stocksSnap.docs.map(doc => doc.data().ticker);
  } catch (error) {
    console.error('Error fetching watchlist tickers:', error);
    throw error;
  }
}

export async function analyzeScreenshot(userId: string, imageBuffer: Buffer, imageType: string, watchlistTickers: string[]) {
  try {
    // Upload image to Firebase Storage
    const filename = `screenshots/${userId}/${Date.now()}.${imageType.split('/')[1]}`;
    const file = bucket.file(filename);
    await file.save(imageBuffer, {
      metadata: {
        contentType: imageType
      }
    });

    // Get signed URL for the uploaded image
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    // Analyze image with Google Cloud Vision
    const [result] = await vision.textDetection(imageBuffer);
    const detections = result.textAnnotations || [];

    if (detections.length === 0) {
      return {
        matches: [],
        extractedText: '',
        headline: '',
        date: '',
        price: null,
        source: '',
        imageStoragePath: filename,
        message: 'No text detected in image'
      };
    }

    // Extract text and look for stock tickers
    const detectedText = detections[0].description || '';
    const lines = detectedText.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Find matching tickers
    const matches = watchlistTickers.filter(ticker => 
      detectedText.toUpperCase().includes(ticker.toUpperCase())
    );

    // Extract headline, date, price, and source
    let headline = '';
    let date = '';
    let price = null;
    let source = '';

    // Find headline (usually near ticker mention)
    if (matches.length > 0) {
      const tickerIndex = lines.findIndex(line =>
        matches.some(ticker => line.toUpperCase().includes(ticker.toUpperCase()))
      );
      if (tickerIndex !== -1 && lines[tickerIndex + 1]) {
        headline = lines[tickerIndex + 1];
      }
    }

    // Try to find date (look for common date formats)
    const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/i;
    for (const line of lines) {
      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        date = dateMatch[0];
        break;
      }
    }

    // Try to find price (look for dollar amounts)
    const priceRegex = /\$\d+(?:\.\d{2})?/;
    for (const line of lines) {
      const priceMatch = line.match(priceRegex);
      if (priceMatch) {
        price = parseFloat(priceMatch[0].replace('$', ''));
        break;
      }
    }

    // Try to find source (common news sources or URLs)
    const sourceRegex = /(?:Reuters|Bloomberg|CNBC|MarketWatch|Yahoo Finance|Seeking Alpha|Business Wire|PR Newswire|SEC Filing)/i;
    for (const line of lines) {
      const sourceMatch = line.match(sourceRegex);
      if (sourceMatch) {
        source = sourceMatch[0];
        break;
      }
    }

    // Store analysis result
    const analysisDoc = await db.collection('screenshot_analysis').add({
      userId,
      imageStoragePath: filename,
      imageUrl: url,
      detectedText,
      matches,
      headline,
      date,
      price,
      source,
      createdAt: new Date().toISOString()
    });

    // Create news entries for matched tickers
    const newsEntryResults = await Promise.all(matches.map(async (ticker) => {
      try {
        const newsRef = await db.collection('news').add({
          userId,
          ticker,
          headline,
          date: date || new Date().toISOString(),
          price,
          source,
          imageUrl: url,
          type: 'screenshot',
          createdAt: new Date().toISOString()
        });
        return { ticker, success: true, id: newsRef.id };
      } catch (error) {
        console.error(`Failed to create news entry for ${ticker}:`, error);
        return { ticker, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }));

    return {
      matches,
      extractedText: detectedText,
      headline,
      date,
      price,
      source,
      imageStoragePath: filename,
      newsEntryResults,
      message: matches.length > 0 
        ? `Found ${matches.length} watchlist stocks in image`
        : 'No watchlist stocks found in image'
    };
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    throw error;
  }
} 