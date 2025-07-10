import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from '@/lib/firebase-admin'
import { parse, isValid } from 'date-fns'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const db = await getFirestore();
    
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
    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
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
    
    if (!visionResponse.ok || visionData.error) {
      console.error('Vision API Error:', visionData.error || visionData)
      return NextResponse.json({ error: 'Failed to process image', visionError: visionData.error, visionData: visionData }, { status: 500 })
    }

    const extractedText = visionData.responses?.[0]?.fullTextAnnotation?.text || ''
    
    if (!extractedText) {
      return NextResponse.json({ 
        error: 'No text extracted from image',
        visionData: visionData 
      }, { status: 400 })
    }
    
    // Process the extracted text to find earnings events
    const events = await processEarningsText(extractedText, db)
    
    return NextResponse.json({ 
      success: true, 
      events: events,
      extractedText: extractedText.substring(0, 500) + '...', // Preview of extracted text
      message: events.length > 0 
        ? `✅ Successfully processed image and found ${events.length} earnings events`
        : `⚠️ No earnings events found in the image. Please check the image quality and try again.`
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ 
      error: 'Failed to process file', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
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
      processedText: text.substring(0, 500) + '...', // Preview of processed text
      message: events.length > 0 
        ? `✅ Successfully processed text and found ${events.length} earnings events`
        : `⚠️ No earnings events found in the provided text. Please check the format and try again.`
    })
  } catch (error) {
    console.error('Text processing error:', error)
    return NextResponse.json({ 
      error: 'Failed to process text', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

async function processEarningsText(text: string, db: any) {
  // Validate input
  if (!text || typeof text !== 'string') {
    console.warn('Invalid text input:', text)
    return []
  }
  
  console.log(`Processing earnings text (${text.length} characters):`)
  console.log('Text preview:', text.substring(0, 500) + '...')
  
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
    if (typeof line !== 'string' || !line) continue;
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Look for ticker patterns (1-5 letter codes, case-insensitive) - more flexible
    let tickerMatch = null
    try {
      // Try multiple patterns for better ticker detection
      const tickerPatterns = [
        /\b([A-Za-z]{1,5})\b/, // Standard ticker format
        /\b([A-Za-z]{1,5})\s/, // Ticker followed by space
        /^([A-Za-z]{1,5})\s/, // Ticker at start of line
        /\s([A-Za-z]{1,5})\s/, // Ticker between spaces
        /\s([A-Za-z]{1,5})$/, // Ticker at end of line
        /\b([A-Za-z]{1,5})[\/\-]/ // Ticker followed by slash or dash
      ]
      
      for (const pattern of tickerPatterns) {
        tickerMatch = trimmedLine.match(pattern)
        if (tickerMatch && tickerMatch[1]) {
          break
        }
      }
    } catch (tickerError) {
      console.warn('Ticker match error:', tickerError, 'for line:', trimmedLine)
      continue
    }
    
    if (tickerMatch && tickerMatch[1]) {
      const ticker = tickerMatch[1].toUpperCase()
      const companyName = companyTickers[ticker] || `${ticker}`
      
      console.log(`Found ticker: ${ticker} in line: "${trimmedLine}"`)
      
      // Look for date patterns (support 2-digit years, dashes, slashes, and month names)
      const datePatterns = [
        /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,
        /(\d{1,2}-\d{1,2}-\d{2,4})/g,
        /(\w+ \d{1,2},? \d{2,4})/g,
        /(\d{4}-\d{2}-\d{2})/g,
        /(\d{1,2}\.\d{1,2}\.\d{2,4})/g, // DD.MM.YYYY format
        /(\d{1,2}\s+\d{1,2}\s+\d{2,4})/g, // DD MM YYYY format
        /(\w+\s+\d{1,2}\s+\d{4})/g, // Month DD YYYY
        /(\d{1,2}\/\d{1,2})/g, // MM/DD (current year assumed)
        /(\d{1,2}-\d{1,2})/g // MM-DD (current year assumed)
      ]
      
      let eventDate = null
      for (const pattern of datePatterns) {
        if (!(pattern instanceof RegExp)) continue;
        if (typeof trimmedLine !== 'string' || !trimmedLine) continue;
        try {
          const dateMatch = trimmedLine.match(pattern);
          if (dateMatch && dateMatch[1]) {
            let dateStr = dateMatch[1]
            let parsedDate: Date | null = null
            
            console.log(`Trying to parse date: "${dateStr}" from line: "${trimmedLine}"`)
            
            // Try date-fns parse for common formats
            const formats = [
              'MM/dd/yy', 'MM-dd-yy', 'MM/dd/yyyy', 'MM-dd-yyyy',
              'dd/MM/yy', 'dd-MM-yy', 'dd/MM/yyyy', 'dd-MM-yyyy',
              'MMM dd yyyy', 'MMMM dd yyyy', 'MMM dd, yyyy', 'MMMM dd, yyyy'
            ]
            
            for (const fmt of formats) {
              try {
                const d = parse(dateStr, fmt, new Date())
                if (isValid(d)) {
                  parsedDate = d
                  console.log(`Successfully parsed date with format ${fmt}:`, parsedDate)
                  break
                }
              } catch (parseError) {
                console.warn('Date parse error:', parseError, 'for date:', dateStr, 'format:', fmt)
                continue
              }
            }
            
            // Fallback to native Date
            if (!parsedDate) {
              try {
                parsedDate = new Date(dateStr)
                if (isValid(parsedDate)) {
                  console.log(`Successfully parsed date with native Date:`, parsedDate)
                }
              } catch (dateError) {
                console.warn('Native date parse error:', dateError, 'for date:', dateStr)
                continue
              }
            }
            if (parsedDate && isValid(parsedDate)) {
              eventDate = parsedDate
              break
            }
          }
        } catch (matchError) {
          console.warn('Pattern match error:', matchError, 'for line:', trimmedLine, 'pattern:', pattern)
          continue
        }
      }
      
      if (eventDate && !isNaN(eventDate.getTime())) {
        // Determine earnings type from text
        let earningsType = 'BMO' // Default to Before Market Open
        if (trimmedLine.toLowerCase().includes('after market') || 
            trimmedLine.toLowerCase().includes('amc') ||
            trimmedLine.toLowerCase().includes('after hours')) {
          earningsType = 'AMC'
        }
        
        console.log(`Creating earnings event: ${ticker} on ${eventDate.toISOString().split('T')[0]} (${earningsType})`)
        
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
      } else {
        // No valid date found, but we have a ticker - create event with current date as fallback
        console.log(`No valid date found for ${ticker}, using current date as fallback`)
        
        const fallbackDate = new Date()
        fallbackDate.setDate(fallbackDate.getDate() + 7) // Default to next week
        
        let earningsType = 'BMO' // Default to Before Market Open
        if (trimmedLine.toLowerCase().includes('after market') || 
            trimmedLine.toLowerCase().includes('amc') ||
            trimmedLine.toLowerCase().includes('after hours')) {
          earningsType = 'AMC'
        }
        
        events.push({
          stockTicker: ticker,
          companyName: companyName,
          earningsDate: fallbackDate.toISOString(),
          earningsType: earningsType,
          isConfirmed: false, // Mark as unconfirmed since we don't have a real date
          estimatedEPS: null,
          estimatedRevenue: null,
          conferenceCallUrl: null,
          event_type: 'Earnings Call',
          note: 'Date estimated - no valid date found in text'
        })
      }
    }
  }
  
  // Fallback: If no events found with ticker detection, try company name detection
  if (events.length === 0) {
    console.log('No events found with ticker detection, trying company name fallback...')
    
    const lines = text.split('\n')
    for (const line of lines) {
      if (typeof line !== 'string' || !line) continue;
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Look for company names in the text
      for (const [ticker, companyName] of Object.entries(companyTickers)) {
        if (trimmedLine.toLowerCase().includes(companyName.toLowerCase()) || 
            trimmedLine.toLowerCase().includes(ticker.toLowerCase())) {
          
          console.log(`Found company match: ${companyName} (${ticker}) in line: "${trimmedLine}"`)
          
          // Try to find a date in this line
          let eventDate = null
          const datePatterns = [
            /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,
            /(\d{1,2}-\d{1,2}-\d{2,4})/g,
            /(\w+ \d{1,2},? \d{2,4})/g,
            /(\d{4}-\d{2}-\d{2})/g
          ]
          
          for (const pattern of datePatterns) {
            try {
              const dateMatch = trimmedLine.match(pattern);
              if (dateMatch && dateMatch[1]) {
                const parsedDate = new Date(dateMatch[1])
                if (isValid(parsedDate)) {
                  eventDate = parsedDate
                  break
                }
              }
            } catch (error) {
              continue
            }
          }
          
          if (eventDate) {
            let earningsType = 'BMO'
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
              event_type: 'Earnings Call',
              source: 'company_name_fallback'
            })
            
            console.log(`Created fallback event: ${ticker} on ${eventDate.toISOString().split('T')[0]}`)
          }
          
          break // Only process first match per line
        }
      }
    }
  }
  
  // Save events to Firebase if any found
  if (events.length > 0) {
    try {
      const batch = db.batch()
      let addedCount = 0
      let skippedCount = 0
      
      for (const event of events) {
        try {
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
        } catch (eventError) {
          console.warn('Error processing event:', eventError, 'for event:', event)
          continue
        }
      }
      
      if (addedCount > 0) {
        await batch.commit()
        console.log(`Added ${addedCount} earnings events, skipped ${skippedCount} duplicates`)
      }
    } catch (batchError) {
      console.error('Error saving events to Firebase:', batchError)
      // Don't fail the entire request if Firebase save fails
    }
  }
  
  console.log(`Processing complete. Found ${events.length} earnings events:`)
  events.forEach((event, index) => {
    console.log(`  ${index + 1}. ${event.stockTicker} - ${event.companyName} - ${event.earningsDate} - ${event.earningsType}`)
  })
  
  return events
} 