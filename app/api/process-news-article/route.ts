import { NextRequest, NextResponse } from 'next/server'
import { getAuth, getFirestore } from '@/lib/firebase-admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Common stock tickers to match against
const COMMON_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC',
  'UBER', 'LYFT', 'SHOP', 'SPOT', 'SNOW', 'PLTR', 'RBLX', 'COIN', 'HOOD', 'SOFI',
  'DDOG', 'ADBE', 'WDAY', 'MDB', 'NOW', 'VEEV', 'CRWD', 'ZM', 'DOCU', 'OKTA',
  'TWLO', 'TEAM', 'SPLK', 'WDAY', 'PANW', 'FTNT', 'CHKP', 'CYBR', 'ZSCL', 'SAIL',
  'CRM', 'ORCL', 'BABA', 'NTES', 'JD', 'PDD', 'BIDU', 'TCOM', 'BILI', 'IQ'
];

// Extract stock tickers from text
function extractTickersFromText(text: string): string[] {
  const patterns = [
    /\$([A-Z]{1,5})\b/g,  // $AAPL format
    /\b([A-Z]{2,5})\b/g,  // AAPL format (2-5 letters)
    /\b([A-Z]{1,5})\s+(?:stock|shares|equity|ticker)/gi,  // AAPL stock
    /(?:NYSE|NASDAQ):\s*([A-Z]{1,5})/gi,  // NYSE: AAPL
  ];
  
  const found = new Set<string>();
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const ticker = match.replace(/[\$\s:]/g, '').replace(/(?:stock|shares|equity|ticker)/gi, '').toUpperCase();
        if (ticker.length >= 1 && ticker.length <= 5 && COMMON_TICKERS.includes(ticker)) {
          found.add(ticker);
        }
      });
    }
  });
  
  return Array.from(found);
}

// Extract headline from article
function extractHeadline(text: string): string {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Look for the first substantial line that could be a headline
  for (const line of lines) {
    if (line.length > 20 && line.length < 200 && !line.includes('http') && !line.includes('www')) {
      return line;
    }
  }
  
  // Fallback to first line
  return lines[0] || 'News Article';
}

// Extract date from article
function extractDate(text: string): string {
  const datePatterns = [
    /\d{1,2}\/\d{1,2}\/\d{4}/,  // MM/DD/YYYY
    /\d{4}-\d{2}-\d{2}/,        // YYYY-MM-DD
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i,  // Month DD, YYYY
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,  // Full month name
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

// Extract relevant snippet from article
function extractSnippet(text: string, maxLength: number = 300): string {
  // Remove URLs, excessive whitespace, and common article metadata
  const cleaned = text
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/www\.[^\s]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Try to cut at sentence boundary
  const sentences = cleaned.split(/[.!?]+/);
  let snippet = '';
  
  for (const sentence of sentences) {
    if (snippet.length + sentence.length > maxLength) {
      break;
    }
    snippet += sentence + '. ';
  }
  
  return snippet.trim() || cleaned.substring(0, maxLength) + '...';
}

export async function POST(request: NextRequest) {
  try {
    const db = await getFirestore();
    
    // Authenticate user
    const authHeader = request.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    
    let userId: string;
    
    // Development bypass for localhost
    if (idToken === 'dev-token-localhost') {
      userId = 'test-user-localhost';
      console.log('🔧 Development mode - using test user for process-news-article');
    } else {
      let decodedToken;
      try {
        decodedToken = await (await getAuth()).verifyIdToken(idToken);
      } catch (err) {
        return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
      }
      userId = decodedToken.uid;
    }

    const body = await request.json();
    const { articleText } = body;

    if (!articleText || typeof articleText !== 'string' || articleText.length < 50) {
      return NextResponse.json({ 
        success: false, 
        error: 'Article text is required and must be at least 50 characters long' 
      }, { status: 400 });
    }

    // Get user's watchlist
    const stocksSnap = await db.collection('stocks')
      .where('userId', '==', userId)
      .get();
    
    const watchlistTickers = stocksSnap.docs.map(doc => doc.data().ticker);

    // Extract information from article
    const extractedTickers = extractTickersFromText(articleText);
    const headline = extractHeadline(articleText);
    const date = extractDate(articleText);
    const snippet = extractSnippet(articleText);

    console.log('Extracted tickers:', extractedTickers);
    console.log('Headline:', headline);
    console.log('Date:', date);
    console.log('User watchlist:', watchlistTickers);

    // Filter tickers to only include those in user's watchlist
    const matchedTickers = extractedTickers.filter(ticker => 
      watchlistTickers.includes(ticker.toUpperCase())
    );

    console.log('Matched tickers in watchlist:', matchedTickers);

    // Create catalyst entries for matched tickers
    const results = [];
    let successCount = 0;

    for (const ticker of matchedTickers) {
      try {
        const catalystData = {
          userId,
          stockTickers: [ticker.toUpperCase()],
          title: headline,
          description: `News article processing:\n\n${snippet}`,
          date: date,
          imageUrl: null,
          isManual: false,
          createdAt: new Date().toISOString(),
          priceBefore: null,
          priceAfter: null,
          source: 'News Article Processing',
        };

        const docRef = await db.collection('catalysts').add(catalystData);
        
        results.push({
          ticker: ticker.toUpperCase(),
          success: true,
          id: docRef.id,
        });
        
        successCount++;
        console.log(`Created catalyst entry for ${ticker}:`, docRef.id);
      } catch (error) {
        console.error(`Error creating catalyst for ${ticker}:`, error);
        results.push({
          ticker: ticker.toUpperCase(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      tickers: matchedTickers,
      headline,
      date,
      snippet,
      results,
      successCount,
      message: successCount > 0 
        ? `Successfully created ${successCount} catalyst entries from news article`
        : 'No matching stocks found in your watchlist'
    });
    
  } catch (error) {
    console.error('Error processing news article:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process news article' 
    }, { status: 500 });
  }
} 