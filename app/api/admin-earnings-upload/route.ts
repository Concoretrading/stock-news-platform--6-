import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import tickers from '@/lib/tickers.json';

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
  // Enhanced date patterns for earnings calendars
  const datePatterns = [
    // Calendar formats like "Dec 15", "January 20"
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b/gi,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b/gi,
    // Numeric formats like "12/15", "1/20"
    /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g,
    // Dash formats like "12-15", "1-20"
    /\b\d{1,2}-\d{1,2}(?:-\d{2,4})?\b/g,
    // Calendar specific formats like "Mon 15", "Tue 20"
    /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{1,2}\b/gi,
    // ISO format dates
    /\b\d{4}-\d{1,2}-\d{1,2}\b/g
  ];
  
  const dates: string[] = [];
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  });
  
  if (dates.length === 0) return null;
  
  // For calendar screenshots, return the first valid date found
  return dates[0];
}

function parseCalendarText(detectedText: string): Array<{company: string, ticker: string, date: string, timing?: string}> {
  console.log('Parsing calendar text for structured earnings data...');
  
  const lines = detectedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const calendarEvents: Array<{company: string, ticker: string, date: string, timing?: string}> = [];
  
  // Look for calendar table patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip header lines and dates-only lines
    if (line.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/i) || 
        line.match(/^\d+$/) || 
        line.length < 3) {
      continue;
    }
    
    // Look for company names in the text
    for (const [company, ticker] of Object.entries(companyToTicker)) {
      // Check if this line contains a company name or ticker
      const hasCompany = line.toLowerCase().includes(company.toLowerCase()) || 
                        line.toLowerCase().includes(ticker.toLowerCase());
      
      if (hasCompany) {
        // Look for dates in nearby lines (within 3 lines)
        let foundDate = null;
        let foundTiming = null;
        
        for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) {
          const nearbyLine = lines[j];
          
          // Check for dates in nearby lines
          const dateMatch = nearbyLine.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b/i) ||
                           nearbyLine.match(/\b\d{1,2}\/\d{1,2}\b/) ||
                           nearbyLine.match(/\b\d{1,2}-\d{1,2}\b/);
          
          if (dateMatch) {
            foundDate = dateMatch[0];
          }
          
          // Check for timing information
          if (nearbyLine.toLowerCase().includes('bmo') || nearbyLine.toLowerCase().includes('before market')) {
            foundTiming = 'BMO';
          } else if (nearbyLine.toLowerCase().includes('amc') || nearbyLine.toLowerCase().includes('after market')) {
            foundTiming = 'AMC';
          }
        }
        
        if (foundDate) {
          calendarEvents.push({
            company,
            ticker,
            date: foundDate,
            timing: foundTiming || 'BMO' // Default to BMO
          });
          
          console.log(`Found calendar event: ${company} (${ticker}) on ${foundDate} ${foundTiming || 'BMO'}`);
        }
      }
    }
  }
  
  return calendarEvents;
}

export async function POST(request: NextRequest) {
  console.log('POST /api/admin-earnings-upload called at', new Date().toISOString());
  try {
    // Check if this is a bulk paste request
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (body.bulkPaste) {
        // Accept optional default date from frontend
        const defaultDateRaw = body.defaultDate;
        let defaultDate: Date | null = null;
        if (defaultDateRaw) {
          const parsed = tryParseDate(defaultDateRaw);
          if (parsed && !isNaN(parsed.getTime())) defaultDate = parsed;
        }
        // Parse pasted lines flexibly
        const lines = body.bulkPaste.split('\n').map((l: string) => l.trim()).filter(Boolean);
        const events = [];
        const skipped = [];
        for (const line of lines) {
          // Remove hashtags and comments
          const cleanLine = line.replace(/^#.*$/, '').replace(/#.*/, '').trim();
          if (!cleanLine) continue;
          // Split into words
          const parts = cleanLine.split(/\s+|,|\t/).filter(Boolean);
          let ticker = null;
          let dateObj = null;
          let timing = null;
          // Try to find a ticker (1-5 letters, matches known tickers or looks like a ticker)
          for (const part of parts) {
            if (/^[A-Za-z]{1,5}$/.test(part)) {
              ticker = part.toUpperCase();
              break;
            }
          }
          // If not found, fallback: first 1-5 letter word
          if (!ticker) {
            const fallback = parts.find((p: string) => /^[A-Za-z]{1,5}$/.test(p));
            if (fallback) ticker = fallback.toUpperCase();
          }
          // Try to find a date in any part
          for (const part of parts) {
            const parsed = tryParseDate(part);
            if (parsed && !isNaN(parsed.getTime())) {
              dateObj = parsed;
              break;
            }
          }
          // If no date found, use defaultDate if available
          if (!dateObj && defaultDate) dateObj = defaultDate;
          // Try to find timing (AMC/BMO)
          for (const part of parts) {
            if (/^(AMC|BMO)$/i.test(part)) {
              timing = part.toUpperCase();
              break;
            }
          }
          if (!ticker || !dateObj) {
            skipped.push({ line, reason: !ticker ? 'No valid ticker' : 'No valid date' });
            continue;
          }
          // Lookup company name
          const tickerEntry = tickers.find(t => t.ticker.toUpperCase() === ticker);
          const companyName = tickerEntry ? tickerEntry.name : ticker;
          events.push({
            companyName,
            stockTicker: ticker,
            earningsDate: dateObj.toISOString().split('T')[0],
            earningsType: timing === 'BMO' ? 'BMO' : 'AMC',
            isConfirmed: true,
            estimatedEPS: null,
            estimatedRevenue: null,
            source: 'admin_bulk_paste',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        // Save to Firestore
        if (events.length > 0) {
          const { getFirestore } = await import('@/lib/firebase-admin');
          const db = await getFirestore();
          const batch = db.batch();
          for (const event of events) {
            const docRef = db.collection('earnings_calendar').doc();
            batch.set(docRef, event);
          }
          await batch.commit();
        }
        return NextResponse.json({ success: true, added: events.length, skipped });
      }
    }

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

    // Enhanced calendar parsing: Try structured calendar text extraction
    console.log('Attempting enhanced calendar parsing...');
    const calendarEvents = parseCalendarText(detectedText);
    
    // Add calendar events to the main events array
    for (const calEvent of calendarEvents) {
      // Check if this event already exists (avoid duplicates)
      const exists = events.some(e => e.stockTicker === calEvent.ticker && e.earningsDate === parseDate(calEvent.date).toISOString().split('T')[0]);
      
      if (!exists) {
        events.push({
          companyName: calEvent.company,
          stockTicker: calEvent.ticker,
          earningsDate: parseDate(calEvent.date).toISOString().split('T')[0],
          earningsType: calEvent.timing || 'BMO',
          isConfirmed: true,
          estimatedEPS: null,
          estimatedRevenue: null,
          source: 'admin_upload_calendar',
          detectedFromCalendar: true,
          detectedDate: calEvent.date
        });
      }
    }

    // Fallback: If still no events detected, try simple text extraction
    if (events.length === 0) {
      console.log('No structured events detected, trying simple text extraction...');
      
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
            source: 'admin_upload_fallback',
            detectedFromText: true,
            detectedLine: match.line
          });
        }
      }
    }

    // Remove duplicate events (same ticker and date)
    const uniqueEvents = [];
    const seen = new Set();
    
    for (const event of events) {
      const key = `${event.stockTicker}-${event.earningsDate}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueEvents.push(event);
      }
    }

    console.log(`Processed ${uniqueEvents.length} unique earnings events from ${events.length} total detections`);

    // Sort events by date
    uniqueEvents.sort((a, b) => new Date(a.earningsDate).getTime() - new Date(b.earningsDate).getTime());

    return NextResponse.json({
      success: true,
      events: uniqueEvents.slice(0, 20), // Increased limit for calendar screenshots
      extractedText: detectedText.substring(0, 1000), // More text for debugging
      logoCount: logos.length,
      calendarEventCount: calendarEvents?.length || 0,
      message: `📅 Processed earnings calendar screenshot - found ${uniqueEvents.length} unique events (${logos.length} logo detections + ${calendarEvents?.length || 0} calendar text extractions)`
    });

  } catch (error: any) {
    // Log the error and stack trace for debugging
    console.error('Bulk earnings paste error:', error);
    if (error && error.stack) {
      console.error(error.stack);
    }
    // Return the error message in the response for debugging
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
} 

// Helper: Try to parse a date from various formats
function tryParseDate(str: string): Date | null {
  // Try ISO, MM/DD/YY, MM/DD/YYYY, YYYY-MM-DD, MMM DD YYYY, etc.
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str);
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(str)) {
    const [m, d, y] = str.split('/');
    let year = y.length === 2 ? '20' + y : y;
    return new Date(`${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  }
  if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[ .-]?\d{1,2}[,]?[ .-]?\d{2,4}?$/i.test(str)) {
    // e.g. Jul 23 2025, July 23, 2025
    return new Date(str);
  }
  // Try Date.parse fallback
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) return new Date(parsed);
  return null;
} 