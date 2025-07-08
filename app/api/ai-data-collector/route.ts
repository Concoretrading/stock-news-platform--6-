import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Only allow admin access
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { stockTicker } = await request.json();

    if (!stockTicker) {
      return NextResponse.json({ error: 'Stock ticker is required' }, { status: 400 });
    }

    // Verify the stock is being monitored by this user
    const subscriptionSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('stockTicker', '==', stockTicker.toUpperCase())
      .where('isActive', '==', true)
      .get();

    if (subscriptionSnap.empty) {
      return NextResponse.json({ error: 'Stock must be in your AI monitoring list' }, { status: 400 });
    }

    // Start data collection process
    const collectionResults = await collectDataForStock(stockTicker.toUpperCase());

    return NextResponse.json({ 
      stockTicker: stockTicker.toUpperCase(),
      results: collectionResults,
      message: 'Data collection completed successfully' 
    });
  } catch (error) {
    console.error('Error in data collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function collectDataForStock(stockTicker: string) {
  const results = {
    ownData: { processed: 0, eventsFound: 0 },
    websiteScan: { processed: 0, eventsFound: 0 },
    earningsTranscripts: { processed: 0, eventsFound: 0 },
    totalEvents: 0
  };

  // PHASE 1: Process our own data first (screenshots, manual entries)
  console.log(`Phase 1: Processing own data for ${stockTicker}`);
  const ownDataResults = await processOwnData(stockTicker);
  results.ownData = ownDataResults;

  // PHASE 2: Scan company website for changes
  console.log(`Phase 2: Scanning website for ${stockTicker}`);
  const websiteResults = await scanCompanyWebsite(stockTicker);
  results.websiteScan = websiteResults;

  // PHASE 3: Process earnings transcripts
  console.log(`Phase 3: Processing earnings transcripts for ${stockTicker}`);
  const transcriptResults = await processEarningsTranscripts(stockTicker);
  results.earningsTranscripts = transcriptResults;

  results.totalEvents = results.ownData.eventsFound + results.websiteScan.eventsFound + results.earningsTranscripts.eventsFound;

  return results;
}

async function processOwnData(stockTicker: string) {
  let processed = 0;
  let eventsFound = 0;

  try {
    // Get recent catalysts/screenshots for this stock
    const catalystsSnap = await db.collection('catalysts')
      .where('stockTickers', 'array-contains', stockTicker)
      .where('isManual', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    for (const doc of catalystsSnap.docs) {
      const catalyst = doc.data();
      processed++;

      // Process the catalyst content for future events
      const content = `${catalyst.title} ${catalyst.description || ''}`;
      
      // Add to AI processing queue
      await db.collection('ai_content_queue').add({
        stockTicker,
        contentType: 'screenshot',
        rawContent: content,
        sourceUrl: catalyst.imageUrl || null,
        publishedAt: catalyst.date || new Date().toISOString(),
        processingStatus: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        priority: 'high' // Own data gets highest priority
      });

      // Simulate immediate processing for demo
      const mockAnalysis = await simulateAIProcessing(content, stockTicker, 'screenshot');
      eventsFound += mockAnalysis.events.length;

      // Create events if found
      if (mockAnalysis.events.length > 0) {
        for (const event of mockAnalysis.events) {
          await db.collection('ai_detected_events').add({
            stockTicker,
            eventType: event.type,
            title: event.title,
            description: event.description,
            sourceUrl: catalyst.imageUrl,
            sourceType: 'screenshot',
            confidenceScore: event.confidence,
            eventDate: event.date,
            eventTime: event.time,
            rawText: content,
            aiAnalysis: mockAnalysis,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dataSource: 'own_data'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing own data:', error);
  }

  return { processed, eventsFound };
}

async function scanCompanyWebsite(stockTicker: string) {
  let processed = 0;
  let eventsFound = 0;

  try {
    // Get website monitoring data for this stock
    const websiteSnap = await db.collection('website_monitoring')
      .where('stockTicker', '==', stockTicker)
      .where('isActive', '==', true)
      .get();

    if (!websiteSnap.empty) {
      const website = websiteSnap.docs[0].data();
      processed++;

      // Simulate website content scanning
      const mockWebsiteContent = await simulateWebsiteScan(website.websiteUrl, stockTicker);
      
      if (mockWebsiteContent) {
        // Add to AI processing queue
        await db.collection('ai_content_queue').add({
          stockTicker,
          contentType: 'website_content',
          rawContent: mockWebsiteContent,
          sourceUrl: website.websiteUrl,
          publishedAt: new Date().toISOString(),
          processingStatus: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
          priority: 'medium'
        });

        // Simulate processing
        const mockAnalysis = await simulateAIProcessing(mockWebsiteContent, stockTicker, 'website_content');
        eventsFound += mockAnalysis.events.length;

        // Create events if found
        if (mockAnalysis.events.length > 0) {
          for (const event of mockAnalysis.events) {
            await db.collection('ai_detected_events').add({
              stockTicker,
              eventType: event.type,
              title: event.title,
              description: event.description,
              sourceUrl: website.websiteUrl,
              sourceType: 'website_content',
              confidenceScore: event.confidence,
              eventDate: event.date,
              eventTime: event.time,
              rawText: mockWebsiteContent,
              aiAnalysis: mockAnalysis,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              dataSource: 'website_scan'
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error scanning website:', error);
  }

  return { processed, eventsFound };
}

async function processEarningsTranscripts(stockTicker: string) {
  let processed = 0;
  let eventsFound = 0;

  try {
    // Get earnings calendar data for this stock
    const earningsSnap = await db.collection('earnings_calendar')
      .where('stockTicker', '==', stockTicker)
      .where('isConfirmed', '==', true)
      .orderBy('earningsDate', 'desc')
      .limit(10)
      .get();

    for (const doc of earningsSnap.docs) {
      const earnings = doc.data();
      processed++;

      // Simulate earnings transcript processing
      const mockTranscript = await simulateEarningsTranscript(stockTicker, earnings.earningsDate);
      
      if (mockTranscript) {
        // Add to AI processing queue
        await db.collection('ai_content_queue').add({
          stockTicker,
          contentType: 'earnings_transcript',
          rawContent: mockTranscript,
          sourceUrl: earnings.transcriptUrl || null,
          publishedAt: earnings.earningsDate,
          processingStatus: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
          priority: 'high'
        });

        // Simulate processing
        const mockAnalysis = await simulateAIProcessing(mockTranscript, stockTicker, 'earnings_transcript');
        eventsFound += mockAnalysis.events.length;

        // Create events if found
        if (mockAnalysis.events.length > 0) {
          for (const event of mockAnalysis.events) {
            await db.collection('ai_detected_events').add({
              stockTicker,
              eventType: event.type,
              title: event.title,
              description: event.description,
              sourceUrl: earnings.transcriptUrl,
              sourceType: 'earnings_transcript',
              confidenceScore: event.confidence,
              eventDate: event.date,
              eventTime: event.time,
              rawText: mockTranscript,
              aiAnalysis: mockAnalysis,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              dataSource: 'earnings_transcript'
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing earnings transcripts:', error);
  }

  return { processed, eventsFound };
}

// Mock functions for demonstration
async function simulateWebsiteScan(websiteUrl: string, stockTicker: string): Promise<string | null> {
  // Simulate website content changes
  const mockContent = {
    'AAPL': 'Apple announces iPhone 16 launch event on September 10, 2024. New features include advanced AI capabilities and improved camera system.',
    'TSLA': 'Tesla Q1 2024 earnings call scheduled for April 23, 2024. Cybertruck production update expected during the call.',
    'NVDA': 'NVIDIA GTC 2024 conference will be held March 18-21, 2024 in San Jose. New AI chip announcements expected.'
  };

  return mockContent[stockTicker as keyof typeof mockContent] || null;
}

async function simulateEarningsTranscript(stockTicker: string, earningsDate: string): Promise<string | null> {
  // Simulate earnings transcript content
  const mockTranscripts = {
    'AAPL': `Apple Q4 2023 Earnings Call Transcript:
    Tim Cook: "We're excited to announce our next major product launch will be on September 10, 2024. This will be our most significant iPhone update yet."
    Luca Maestri: "We expect strong growth in our Services segment, with new features launching in Q2 2024."`,
    'TSLA': `Tesla Q4 2023 Earnings Call Transcript:
    Elon Musk: "Cybertruck production is ramping up and we expect to reach full capacity by Q2 2024. We'll provide detailed updates on our next earnings call scheduled for April 23, 2024."
    Zach Kirkhorn: "We're planning a major software update for March 2024 that will include new autonomous features."`,
    'NVDA': `NVIDIA Q4 2023 Earnings Call Transcript:
    Jensen Huang: "Our next-generation AI chips will be unveiled at GTC 2024 on March 18. This represents a major leap forward in AI computing."
    Colette Kress: "We expect to announce new partnerships at our annual meeting on May 15, 2024."`
  };

  return mockTranscripts[stockTicker as keyof typeof mockTranscripts] || null;
}

interface AIEvent {
  type: 'earnings_call' | 'product_announcement' | 'conference';
  title: string;
  description: string;
  date: string;
  time: string;
  confidence: number;
  source: string;
}

interface AIAnalysisResponse {
  events: AIEvent[];
  confidenceScore: number;
  processingTime: number;
  model: string;
  version: string;
  focus: string;
}

// Reuse the AI processing function from the other file
async function simulateAIProcessing(content: string, stockTicker: string, contentType: string): Promise<AIAnalysisResponse> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const events: AIEvent[] = [];
  let confidenceScore = 0.5;

  // Enhanced keyword detection for UPCOMING events
  const lowerContent = content.toLowerCase();
  
  // FUTURE EARNINGS DATES - Look for specific dates mentioned
  if (lowerContent.includes('earnings') || lowerContent.includes('quarterly results')) {
    const dateMatch = content.match(/([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/);
    if (dateMatch) {
      const eventDate = parseDate(dateMatch[1]);
      if (eventDate && eventDate > new Date()) {
        events.push({
          type: 'earnings_call',
          title: `${stockTicker} Q${getCurrentQuarter()} 2024 Earnings Call`,
          description: `Scheduled earnings call and quarterly results announcement`,
          date: eventDate.toISOString().split('T')[0],
          time: '16:30:00',
          confidence: 0.90,
          source: 'date_extraction'
        });
        confidenceScore = Math.max(confidenceScore, 0.90);
      }
    }
  }

  // FUTURE PRODUCT LAUNCHES - Look for launch dates
  if (lowerContent.includes('launch') || lowerContent.includes('announce') || lowerContent.includes('new product')) {
    const dateMatch = content.match(/([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/);
    if (dateMatch) {
      const eventDate = parseDate(dateMatch[1]);
      if (eventDate && eventDate > new Date()) {
        events.push({
          type: 'product_announcement',
          title: `${stockTicker} Product Launch`,
          description: `New product or service launch scheduled`,
          date: eventDate.toISOString().split('T')[0],
          time: '14:00:00',
          confidence: 0.85,
          source: 'date_extraction'
        });
        confidenceScore = Math.max(confidenceScore, 0.85);
      }
    }
  }

  // FUTURE CONFERENCES & EVENTS - Look for event dates
  if (lowerContent.includes('conference') || lowerContent.includes('event') || lowerContent.includes('presentation')) {
    const dateMatch = content.match(/([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/);
    if (dateMatch) {
      const eventDate = parseDate(dateMatch[1]);
      if (eventDate && eventDate > new Date()) {
        events.push({
          type: 'conference',
          title: `${stockTicker} Conference Event`,
          description: `Scheduled conference, presentation, or shareholder event`,
          date: eventDate.toISOString().split('T')[0],
          time: '09:00:00',
          confidence: 0.80,
          source: 'date_extraction'
        });
        confidenceScore = Math.max(confidenceScore, 0.80);
      }
    }
  }

  return {
    events,
    confidenceScore,
    processingTime: 500,
    model: 'future-event-detector',
    version: '2.0',
    focus: 'upcoming_trading_events'
  };
}

// Helper functions
function parseDate(dateStr: string): Date | null {
  try {
    const formats = [
      /([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{1,2})-(\d{1,2})-(\d{4})/,
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format.source.includes('[a-zA-Z]+')) {
          const month = new Date(`${match[1]} 1, 2000`).getMonth();
          return new Date(parseInt(match[3]), month, parseInt(match[2]));
        } else {
          const month = parseInt(match[1]) - 1;
          const day = parseInt(match[2]);
          const year = parseInt(match[3]);
          return new Date(year, month, day);
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return null;
  }
}

function getCurrentQuarter(): number {
  const month = new Date().getMonth();
  return Math.floor(month / 3) + 1;
} 