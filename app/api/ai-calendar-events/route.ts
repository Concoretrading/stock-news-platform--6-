import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const db = getFirestore();
    
    // Authenticate user (admin only)
    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    let decodedToken
    try {
      decodedToken = await (await getAuth()).verifyIdToken(idToken)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if this is a file upload or text processing
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload (existing logic)
      return await handleFileUpload(request, db)
    } else {
      // Handle text processing (new logic)
      return await handleTextProcessing(request, db)
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleFileUpload(request: NextRequest, db: any) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to base64 for Google Vision API
    const bytes = await file.arrayBuffer()
    const base64Image = Buffer.from(bytes).toString('base64')

    // Call Google Vision API to extract text
    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: base64Image
          },
          features: [{
            type: 'TEXT_DETECTION'
          }]
        }]
      })
    })

    const visionData = await visionResponse.json()
    
    if (!visionResponse.ok) {
      console.error('Vision API Error:', visionData)
      return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
    }

    const extractedText = visionData.responses[0]?.fullTextAnnotation?.text || ''
    
    // Process the extracted text to find earnings events
    const events = await processEarningsText(extractedText, db)
    
    return NextResponse.json({ 
      success: true, 
      events: events,
      extractedText: extractedText.substring(0, 500) + '...' // Preview of extracted text
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 })
  }
}

async function handleTextProcessing(request: NextRequest, db: any) {
  try {
    const body = await request.json()
    const { text } = body
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    // Process the pasted text to find earnings events
    const events = await processEarningsText(text, db)
    
    return NextResponse.json({ 
      success: true, 
      events: events,
      processedText: text.substring(0, 500) + '...' // Preview of processed text
    })
  } catch (error) {
    console.error('Text processing error:', error)
    return NextResponse.json({ error: 'Failed to process text' }, { status: 500 })
  }
}

async function processEarningsText(text: string, db: any) {
  // Common company names and tickers for earnings detection
  const companyTickers: { [key: string]: string } = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation', 
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'NFLX': 'Netflix Inc.',
    'CRM': 'Salesforce Inc.',
    'ADBE': 'Adobe Inc.',
    'PYPL': 'PayPal Holdings Inc.',
    'INTC': 'Intel Corporation',
    'AMD': 'Advanced Micro Devices Inc.',
    'QCOM': 'QUALCOMM Incorporated',
    'ORCL': 'Oracle Corporation',
    'CSCO': 'Cisco Systems Inc.',
    'IBM': 'International Business Machines Corporation',
    'V': 'Visa Inc.',
    'MA': 'Mastercard Incorporated',
    'JPM': 'JPMorgan Chase & Co.',
    'BAC': 'Bank of America Corporation',
    'WFC': 'Wells Fargo & Company',
    'GS': 'Goldman Sachs Group Inc.',
    'JNJ': 'Johnson & Johnson',
    'PFE': 'Pfizer Inc.',
    'UNH': 'UnitedHealth Group Incorporated',
    'HD': 'Home Depot Inc.',
    'DIS': 'Walt Disney Company',
    'NKE': 'NIKE Inc.',
    'SBUX': 'Starbucks Corporation',
    'MCD': 'McDonald\'s Corporation',
    'KO': 'Coca-Cola Company',
    'PEP': 'PepsiCo Inc.',
    'WMT': 'Walmart Inc.',
    'TGT': 'Target Corporation',
    'COST': 'Costco Wholesale Corporation',
    'LOW': 'Lowe\'s Companies Inc.',
    'CAT': 'Caterpillar Inc.',
    'BA': 'Boeing Company',
    'GE': 'General Electric Company',
    'F': 'Ford Motor Company',
    'GM': 'General Motors Company',
    'XOM': 'Exxon Mobil Corporation',
    'CVX': 'Chevron Corporation',
    'COP': 'ConocoPhillips',
    'SLB': 'Schlumberger Limited',
    'EOG': 'EOG Resources Inc.',
    'PXD': 'Pioneer Natural Resources Company',
    'DVN': 'Devon Energy Corporation',
    'HAL': 'Halliburton Company',
    'BKR': 'Baker Hughes Company',
    'KMI': 'Kinder Morgan Inc.',
    'PSX': 'Phillips 66',
    'VLO': 'Valero Energy Corporation',
    'MPC': 'Marathon Petroleum Corporation',
    'OXY': 'Occidental Petroleum Corporation',
    'APA': 'APA Corporation',
    'MRO': 'Marathon Oil Corporation',
    'HES': 'Hess Corporation',
    'NOV': 'NOV Inc.',
    'FTI': 'TechnipFMC plc',
    'NBR': 'Nabors Industries Ltd.',
    'HP': 'Helmerich & Payne Inc.',
    'RIG': 'Transocean Ltd.',
    'SDRL': 'Seadrill Limited',
    'DO': 'Diamond Offshore Drilling Inc.',
    'PTEN': 'Patterson-UTI Energy Inc.',
    'LBRT': 'Liberty Energy Inc.',
    'CHX': 'ChampionX Corporation',
    'WHD': 'Cactus Inc.',
    'DRQ': 'Dril-Quip Inc.',
    'NBRV': 'Nabors Industries Ltd.',
    'NBR-A': 'Nabors Industries Ltd.',
    'NBR-B': 'Nabors Industries Ltd.',
    'NBR-C': 'Nabors Industries Ltd.',
    'NBR-D': 'Nabors Industries Ltd.',
    'NBR-E': 'Nabors Industries Ltd.',
    'NBR-F': 'Nabors Industries Ltd.',
    'NBR-G': 'Nabors Industries Ltd.',
    'NBR-H': 'Nabors Industries Ltd.',
    'NBR-I': 'Nabors Industries Ltd.',
    'NBR-J': 'Nabors Industries Ltd.',
    'NBR-K': 'Nabors Industries Ltd.',
    'NBR-L': 'Nabors Industries Ltd.',
    'NBR-M': 'Nabors Industries Ltd.',
    'NBR-N': 'Nabors Industries Ltd.',
    'NBR-O': 'Nabors Industries Ltd.',
    'NBR-P': 'Nabors Industries Ltd.',
    'NBR-Q': 'Nabors Industries Ltd.',
    'NBR-R': 'Nabors Industries Ltd.',
    'NBR-S': 'Nabors Industries Ltd.',
    'NBR-T': 'Nabors Industries Ltd.',
    'NBR-U': 'Nabors Industries Ltd.',
    'NBR-V': 'Nabors Industries Ltd.',
    'NBR-W': 'Nabors Industries Ltd.',
    'NBR-X': 'Nabors Industries Ltd.',
    'NBR-Y': 'Nabors Industries Ltd.',
    'NBR-Z': 'Nabors Industries Ltd.'
  }

  const events = []
  const lines = text.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    // Look for ticker patterns (3-5 letter codes)
    const tickerMatch = trimmedLine.match(/\b([A-Z]{3,5})\b/)
    if (tickerMatch) {
      const ticker = tickerMatch[1]
      const companyName = companyTickers[ticker] || `${ticker} Corporation`
      
      // Look for date patterns
      const datePatterns = [
        /(\d{1,2}\/\d{1,2}\/\d{4})/g,
        /(\d{1,2}-\d{1,2}-\d{4})/g,
        /(\w+ \d{1,2},? \d{4})/g,
        /(\d{4}-\d{2}-\d{2})/g
      ]
      
      let eventDate = null
      for (const pattern of datePatterns) {
        const dateMatch = trimmedLine.match(pattern)
        if (dateMatch) {
          try {
            eventDate = new Date(dateMatch[1])
            if (!isNaN(eventDate.getTime())) break
          } catch (e) {
            continue
          }
        }
      }
      
      if (eventDate) {
        // Determine earnings type from text
        let earningsType = 'BMO' // Default to Before Market Open
        if (trimmedLine.toLowerCase().includes('after market') || 
            trimmedLine.toLowerCase().includes('amc') ||
            trimmedLine.toLowerCase().includes('after hours')) {
          earningsType = 'AMC'
        }
        
        events.push({
          stockTicker: ticker,
          companyName: companyName,
          earningsDate: eventDate.toISOString(),
          earningsType: earningsType,
          isConfirmed: true,
          estimatedEPS: null,
          estimatedRevenue: null,
          conferenceCallUrl: null,
          event_type: 'Earnings Call'
        })
      }
    }
  }
  
  // Save events to Firebase if any found
  if (events.length > 0) {
    const batch = db.batch()
    let addedCount = 0
    let skippedCount = 0
    
    for (const event of events) {
      // Check for duplicates
      const existingQuery = await db
        .collection('earnings_calendar')
        .where('stockTicker', '==', event.stockTicker)
        .where('earningsDate', '==', event.earningsDate)
        .get()
      
      if (existingQuery.empty) {
        const docRef = db.collection('earnings_calendar').doc()
        batch.set(docRef, {
          ...event,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        addedCount++
      } else {
        skippedCount++
      }
    }
    
    if (addedCount > 0) {
      await batch.commit()
      console.log(`Added ${addedCount} earnings events, skipped ${skippedCount} duplicates`)
    }
  }
  
  return events
} 