import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision';

// Initialize Vision API client with proper credentials
let vision: ImageAnnotatorClient;

function initializeVisionClient(): ImageAnnotatorClient {
  try {
    // Check if we're in production (Vercel) or local development
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Production: Use base64 encoded credentials from environment variable
      const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString());
      console.log('Vision API initialized for production with base64 credentials');
      return new ImageAnnotatorClient({ credentials });
    } else {
      // Local development: Use file path and explicit project ID
      const config = {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'concorenews',
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './concorenews-firebase-adminsdk.json'
      };
      console.log('Vision API initialized for local development with config:', config);
      return new ImageAnnotatorClient(config);
    }
  } catch (error) {
    console.error('Failed to initialize Vision API client:', error);
    throw new Error(`Vision API initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Initialize the client at module level
try {
  vision = initializeVisionClient();
} catch (error) {
  console.error('Critical: Vision API client initialization failed:', error);
  // Don't create a fallback client - this will force proper error handling
}

type CloudVisionVertex = protos.google.cloud.vision.v1.IVertex;

interface IVertex {
  x: number;
  y: number;
}

// Map of common company names/logos to their stock tickers
const companyToTicker: Record<string, string> = {
  'JPMorgan': 'JPM',
  'BlackRock': 'BLK',
  'Citi': 'C',
  'ASML': 'ASML',
  'Goldman Sachs': 'GS',
  'Netflix': 'NFLX',
  'Abbott': 'ABT',
  'American Express': 'AXP',
  '3M': 'MMM',
  'Unilever': 'UL',
  'Tesla': 'TSLA',
  'IBM': 'IBM',
  'Intel': 'INTC',
  'Visa': 'V',
  'Coca-Cola': 'KO',
  'Microsoft': 'MSFT',
  'Apple': 'AAPL',
  'AMD': 'AMD',
  'Advanced Micro Devices': 'AMD',
  'PayPal': 'PYPL',
  'Meta': 'META',
  'Facebook': 'META',
  'Alphabet': 'GOOGL',
  'Google': 'GOOGL',
  'Amazon': 'AMZN',
  'NVIDIA': 'NVDA',
  'Salesforce': 'CRM',
  'Oracle': 'ORCL',
  'Adobe': 'ADBE',
  'Cisco': 'CSCO',
  'Broadcom': 'AVGO',
  'Qualcomm': 'QCOM',
  'Texas Instruments': 'TXN',
  'Micron Technology': 'MU',
  'Applied Materials': 'AMAT',
  'Lam Research': 'LRCX',
  'KLA': 'KLAC',
  'Marvell Technology': 'MRVL',
  'Analog Devices': 'ADI',
  'Xilinx': 'XLNX',
  'Synopsys': 'SNPS',
  'Cadence Design Systems': 'CDNS',
  'Autodesk': 'ADSK',
  'ServiceNow': 'NOW',
  'Workday': 'WDAY',
  'Zoom': 'ZM',
  'Slack': 'WORK',
  'Snowflake': 'SNOW',
  'Palantir': 'PLTR',
  'Unity': 'U',
  'Roblox': 'RBLX',
  'Coinbase': 'COIN',
  'Block': 'SQ',
  'Square': 'SQ',
  'Mastercard': 'MA',
  'Berkshire Hathaway': 'BRK.B',
  'Johnson & Johnson': 'JNJ',
  'Procter & Gamble': 'PG',
  'Walmart': 'WMT',
  'Home Depot': 'HD',
  'McDonald\'s': 'MCD',
  'Disney': 'DIS',
  'Nike': 'NKE',
  'Starbucks': 'SBUX',
  'Boeing': 'BA',
  'Caterpillar': 'CAT',
  'Deere': 'DE',
  'General Electric': 'GE',
  'Ford': 'F',
  'General Motors': 'GM',
  'ExxonMobil': 'XOM',
  'Chevron': 'CVX',
  'Wells Fargo': 'WFC',
  'Bank of America': 'BAC',
  'Pfizer': 'PFE',
  'Merck': 'MRK',
  'AbbVie': 'ABBV',
  'Eli Lilly': 'LLY',
  'Bristol Myers Squibb': 'BMY',
  'Moderna': 'MRNA',
  'Regeneron': 'REGN',
  'Gilead Sciences': 'GILD',
  'Biogen': 'BIIB'
};

function convertToIVertex(vertex: CloudVisionVertex): IVertex {
  return {
    x: vertex.x || 0,
    y: vertex.y || 0
  };
}

function getStockTickerFromLogo(logoName: string): string {
  // Try exact match first
  if (companyToTicker[logoName]) {
    return companyToTicker[logoName];
  }
  
  // Try partial matches
  const lowercaseLogo = logoName.toLowerCase();
  for (const [company, ticker] of Object.entries(companyToTicker)) {
    if (lowercaseLogo.includes(company.toLowerCase()) || company.toLowerCase().includes(lowercaseLogo)) {
      return ticker;
    }
  }
  
  // Fallback: return the logo name as ticker if no match found
  return logoName.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 5);
}

function getFullCompanyName(logoName: string): string {
  // Find the full company name from the mapping
  for (const [company, ticker] of Object.entries(companyToTicker)) {
    if (company.toLowerCase().includes(logoName.toLowerCase()) || logoName.toLowerCase().includes(company.toLowerCase())) {
      return company;
    }
  }
  return logoName; // Fallback to logo name if no match
}

function detectEarningsType(text: string): 'BMO' | 'AMC' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('before market') || lowerText.includes('bmo') || lowerText.includes('premarket')) {
    return 'BMO';
  }
  if (lowerText.includes('after market') || lowerText.includes('amc') || lowerText.includes('aftermarket')) {
    return 'AMC';
  }
  return 'BMO'; // Default to Before Market Open
}

function parseDate(dateStr: string): Date {
  const currentYear = new Date().getFullYear();
  // Handle various date formats
  if (dateStr.match(/\w+\s+\d{1,2}/)) {
    return new Date(`${dateStr} ${currentYear}`);
  }
  // Handle MM/DD format
  if (dateStr.match(/\d{1,2}\/\d{1,2}/)) {
    return new Date(`${dateStr}/${currentYear}`);
  }
  // Handle other formats
  return new Date(dateStr);
}

function findNearestDate(text: string, logoVertices: IVertex[]): string | null {
  // Common date patterns for earnings calendars
  const datePatterns = [
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b/gi,
    /\b\d{1,2}\/\d{1,2}\b/g,
    /\b\d{1,2}-\d{1,2}\b/g,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b/gi
  ];
  
  const dates: string[] = [];
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  });
  
  if (dates.length === 0) return null;
  
  // For simplicity, return the first date found
  // In a more sophisticated implementation, you'd calculate spatial proximity
  return dates[0];
}

export async function POST(request: NextRequest) {
  try {
    // Check if Vision API client is properly initialized
    if (!vision) {
      console.error('Vision API client not initialized');
      return NextResponse.json({
        success: false,
        error: 'Google Vision API is not properly configured. Please check your credentials and environment variables.',
        details: 'Vision API client initialization failed'
      }, { status: 500 });
    }

    // Authenticate user (admin only)
    const authHeader = request.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await (await getAuth()).verifyIdToken(idToken);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Only allow admin user
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer for Vision API processing
    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Use Google Vision API to detect logos and text
    let logos: any[] = [];
    let detectedText = '';
    
    try {
      console.log('Attempting Vision API logo detection...');
      const [logoResult] = await vision.logoDetection(imageBuffer);
      logos = logoResult.logoAnnotations || [];
      console.log('Logo detection successful, found:', logos.length, 'logos');
      
      console.log('Attempting Vision API text detection...');
      const [textResult] = await vision.textDetection(imageBuffer);
      detectedText = textResult.fullTextAnnotation?.text || '';
      console.log('Text detection successful, text length:', detectedText.length);
      
    } catch (visionError) {
      console.error('Vision API Error:', visionError);
      // Provide a fallback message when Vision API fails
      return NextResponse.json({
        success: false,
        error: 'Google Vision API is not properly configured. Please check your credentials.',
        details: visionError instanceof Error ? visionError.message : 'Unknown Vision API error'
      }, { status: 500 });
    }

    console.log('Detected logos:', logos.map(l => l.description));
    console.log('Detected text snippet:', detectedText.substring(0, 200));

    // Process detected logos to create earnings events
    const events = [];
    
    for (const logo of logos) {
      const logoName = logo.description || '';
      const vertices = (logo.boundingPoly?.vertices || []).map(convertToIVertex);
      
      // Find the nearest date to this logo
      const nearestDate = findNearestDate(detectedText, vertices);
      
      if (nearestDate) {
        const stockTicker = getStockTickerFromLogo(logoName);
        const companyName = getFullCompanyName(logoName);
        const earningsDate = parseDate(nearestDate);
        
        // Detect earnings type from surrounding text
        const earningsType = detectEarningsType(detectedText);
        
        events.push({
          companyName,
          stockTicker,
          earningsDate: earningsDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          earningsType,
          isConfirmed: true,
          estimatedEPS: null,
          estimatedRevenue: null,
          source: 'admin_upload',
          detectedLogoName: logoName, // Include for debugging
          detectedDate: nearestDate
        });
      }
    }

    // If no logos detected, try to extract company names from text
    if (events.length === 0) {
      console.log('No logos detected, trying text extraction...');
      
      // Look for company names mentioned in text
      const textLines = detectedText.split('\n');
      const companyMatches = [];
      
      for (const line of textLines) {
        for (const [company, ticker] of Object.entries(companyToTicker)) {
          if (line.toLowerCase().includes(company.toLowerCase()) || line.toLowerCase().includes(ticker.toLowerCase())) {
            companyMatches.push({ company, ticker, line });
          }
        }
      }
      
      // Create events from text matches
      for (const match of companyMatches) {
        const nearestDate = findNearestDate(detectedText, []);
        if (nearestDate) {
          events.push({
            companyName: match.company,
            stockTicker: match.ticker,
            earningsDate: parseDate(nearestDate).toISOString().split('T')[0],
            earningsType: detectEarningsType(detectedText),
            isConfirmed: true,
            estimatedEPS: null,
            estimatedRevenue: null,
            source: 'admin_upload',
            detectedFromText: true,
            detectedLine: match.line
          });
        }
      }
    }

    console.log(`Processed ${events.length} earnings events`);

    return NextResponse.json({
      success: true,
      events: events.slice(0, 10), // Limit to 10 events to avoid overwhelming UI
      extractedText: detectedText.substring(0, 500), // Include text snippet for debugging
      message: `Processed earnings screenshot - found ${events.length} events using Google Vision API`
    });

  } catch (error) {
    console.error('Error processing earnings screenshot:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process earnings screenshot'
    }, { status: 500 });
  }
} 