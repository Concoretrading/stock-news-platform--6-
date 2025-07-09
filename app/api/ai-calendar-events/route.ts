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
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
    
    // Only allow admin user
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to base64 for Google Vision API
    const bytes = await file.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');

    // Call Google Vision API to extract text
    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'TEXT_DETECTION'
              }
            ]
          }
        ]
      })
    });

    if (!visionResponse.ok) {
      throw new Error('Failed to process image with Google Vision API');
    }

    const visionData = await visionResponse.json();
    const extractedText = visionData.responses[0]?.textAnnotations[0]?.description || '';

    // Parse earnings data from extracted text
    const earningsEvents = parseEarningsFromText(extractedText);

    // Save earnings events to Firebase
    const batch = db.batch();
    let addedCount = 0;
    let skippedCount = 0;

    for (const event of earningsEvents) {
      // Check for duplicates
      const existingQuery = await db
        .collection('earnings_calendar')
        .where('earningsDate', '==', event.earningsDate)
        .where('stockTicker', '==', event.stockTicker)
        .get();

      if (existingQuery.empty) {
        const docRef = db.collection('earnings_calendar').doc();
        batch.set(docRef, {
          stockTicker: event.stockTicker,
          companyName: event.companyName,
          earningsDate: event.earningsDate,
          earningsType: event.earningsType || 'BMO',
          estimatedEPS: event.estimatedEPS,
          estimatedRevenue: event.estimatedRevenue,
          conferenceCallUrl: event.conferenceCallUrl,
          isConfirmed: true,
          created_at: new Date(),
          updated_at: new Date()
        });
        addedCount++;
      } else {
        skippedCount++;
      }
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      events: earningsEvents,
      message: `Successfully processed ${earningsEvents.length} earnings events. Added ${addedCount} new events, skipped ${skippedCount} duplicates.`,
      addedCount,
      skippedCount,
      totalProcessed: earningsEvents.length
    });
  } catch (error) {
    console.error('Error in AI calendar events:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process earnings screenshot'
    }, { status: 500 })
  }
}

// Function to parse earnings data from text
function parseEarningsFromText(text: string): any[] {
  const events: any[] = [];
  const lines = text.split('\n');
  
  // Common earnings-related keywords
  const earningsKeywords = ['earnings', 'report', 'call', 'quarter', 'results'];
  const companyTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'JPM', 'BAC', 'WFC', 'C', 'JNJ', 'PFE', 'KO', 'DIS', 'WMT', 'HD', 'PYPL', 'CRM', 'ORCL', 'ADBE', 'INTC', 'BA', 'NKE', 'AMD', 'SBUX'];
  
  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    
    // Look for company tickers and earnings-related text
    for (const ticker of companyTickers) {
      if (cleanLine.toUpperCase().includes(ticker) && 
          earningsKeywords.some(keyword => cleanLine.toLowerCase().includes(keyword))) {
        
        // Extract date if present
        const dateMatch = cleanLine.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? new Date(dateMatch[1]) : new Date();
        
        // Extract company name (simplified)
        const companyName = `${ticker} Earnings`;
        
        events.push({
          stockTicker: ticker,
          companyName: companyName,
          earningsDate: date,
          earningsType: 'BMO', // Default to Before Market Open
          estimatedEPS: null,
          estimatedRevenue: null,
          conferenceCallUrl: null
        });
        
        break; // Only add each ticker once
      }
    }
  }
  
  return events;
} 