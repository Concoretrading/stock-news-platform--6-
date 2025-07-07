import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

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

    const { stockTicker, contentType, rawContent, sourceUrl, publishedAt } = await request.json();

    if (!stockTicker || !contentType || !rawContent) {
      return NextResponse.json({ error: 'Stock ticker, content type, and raw content are required' }, { status: 400 });
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

    // Add content to processing queue
    const queueDoc = await db.collection('ai_content_queue').add({
      stockTicker: stockTicker.toUpperCase(),
      contentType,
      rawContent,
      sourceUrl: sourceUrl || null,
      publishedAt: publishedAt || new Date().toISOString(),
      processingStatus: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString()
    });

    // For now, we'll simulate AI processing
    // In the real implementation, this would call OpenAI API
    const mockAnalysis = await simulateAIProcessing(rawContent, stockTicker, contentType);

    // Update the queue item with results
    await queueDoc.update({
      processingStatus: mockAnalysis.events.length > 0 ? 'completed' : 'no_events_found',
      aiAnalysis: mockAnalysis,
      confidenceScore: mockAnalysis.confidenceScore,
      processedAt: new Date().toISOString()
    });

    // If events were found, create AI detected events
    if (mockAnalysis.events.length > 0) {
      for (const event of mockAnalysis.events) {
        await db.collection('ai_detected_events').add({
          stockTicker: stockTicker.toUpperCase(),
          eventType: event.type,
          title: event.title,
          description: event.description,
          sourceUrl: sourceUrl,
          sourceType: contentType,
          confidenceScore: event.confidence,
          eventDate: event.date,
          eventTime: event.time,
          rawText: rawContent,
          aiAnalysis: mockAnalysis,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    const processedDoc = await queueDoc.get();

    return NextResponse.json({ 
      queueItem: { id: processedDoc.id, ...processedDoc.data() },
      eventsFound: mockAnalysis.events.length,
      message: 'Content processed successfully' 
    });
  } catch (error) {
    console.error('Error processing content with AI:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// AI processing function focused on detecting UPCOMING events for trading
async function simulateAIProcessing(content: string, stockTicker: string, contentType: string) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const events: any[] = [];
  let confidenceScore = 0.5;

  // Enhanced keyword detection for UPCOMING events
  const lowerContent = content.toLowerCase();
  
  // FUTURE EARNINGS DATES - Look for specific dates mentioned
  const earningsPatterns = [
    /(?:earnings|quarterly results|financial results).*?(?:on|date|scheduled for|will be|announced for)\s+([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/gi,
    /(?:q[1-4]|quarter)\s+\d{4}\s+(?:earnings|results).*?(?:on|date|scheduled for)\s+([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/gi,
    /(?:conference call|earnings call).*?(?:on|date|scheduled for)\s+([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/gi
  ];

  earningsPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const dateStr = match[1];
      const eventDate = parseDate(dateStr);
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
    });
  });

  // FUTURE PRODUCT LAUNCHES - Look for launch dates
  const launchPatterns = [
    /(?:launch|release|announce|introduce).*?(?:on|date|scheduled for|will be)\s+([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/gi,
    /(?:new|upcoming).*?(?:product|service|feature).*?(?:on|date|scheduled for)\s+([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/gi,
    /(?:available|coming).*?(?:on|date|starting)\s+([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/gi
  ];

  launchPatterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern)];
    matches.forEach(match => {
      const dateStr = match[1];
      const eventDate = parseDate(dateStr);
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
    });
  });

  // FUTURE CONFERENCES & EVENTS - Look for event dates
  const eventPatterns = [
    /(?:conference|event|presentation|keynote).*?(?:on|date|scheduled for|will be)\s+([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/gi,
    /(?:wwdc|ces|gdc|e3|comdex).*?(\d{4}).*?(?:on|date|scheduled for)\s+([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/gi,
    /(?:annual meeting|shareholder meeting).*?(?:on|date|scheduled for)\s+([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/gi
  ];

  eventPatterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern)];
    matches.forEach(match => {
      const dateStr = match[1] || match[2];
      const eventDate = parseDate(dateStr);
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
    });
  });

  // REGULATORY FILINGS - Look for filing deadlines
  const filingPatterns = [
    /(?:sec filing|10-k|10-q|8-k).*?(?:due|filing date|deadline).*?([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/gi,
    /(?:annual report|quarterly report).*?(?:due|filing date).*?([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/gi
  ];

  filingPatterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern)];
    matches.forEach(match => {
      const dateStr = match[1];
      const eventDate = parseDate(dateStr);
      if (eventDate && eventDate > new Date()) {
        events.push({
          type: 'regulatory_filing',
          title: `${stockTicker} SEC Filing`,
          description: `Scheduled regulatory filing or report deadline`,
          date: eventDate.toISOString().split('T')[0],
          time: '16:00:00',
          confidence: 0.75,
          source: 'date_extraction'
        });
        confidenceScore = Math.max(confidenceScore, 0.75);
      }
    });
  });

  // ANALYST EVENTS - Look for analyst day, ratings
  const analystPatterns = [
    /(?:analyst day|analyst meeting).*?(?:on|date|scheduled for)\s+([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/gi,
    /(?:price target|rating|upgrade|downgrade).*?(?:announced|expected).*?(?:on|date)\s+([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/gi
  ];

  analystPatterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern)];
    matches.forEach(match => {
      const dateStr = match[1];
      const eventDate = parseDate(dateStr);
      if (eventDate && eventDate > new Date()) {
        events.push({
          type: 'analyst_event',
          title: `${stockTicker} Analyst Event`,
          description: `Scheduled analyst meeting, rating, or price target update`,
          date: eventDate.toISOString().split('T')[0],
          time: '09:30:00',
          confidence: 0.70,
          source: 'date_extraction'
        });
        confidenceScore = Math.max(confidenceScore, 0.70);
      }
    });
  });

  return {
    events,
    confidenceScore,
    processingTime: 1000,
    model: 'future-event-detector',
    version: '2.0',
    focus: 'upcoming_trading_events'
  };
}

// Helper function to parse various date formats
function parseDate(dateStr: string): Date | null {
  try {
    // Try various date formats
    const formats = [
      /([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/, // "January 15, 2024" or "January 15 2024"
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // "1/15/2024"
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // "1-15-2024"
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format.source.includes('[a-zA-Z]+')) {
          // Month name format
          const month = new Date(`${match[1]} 1, 2000`).getMonth();
          return new Date(parseInt(match[3]), month, parseInt(match[2]));
        } else {
          // Numeric format
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

// Helper function to get current quarter
function getCurrentQuarter(): number {
  const month = new Date().getMonth();
  return Math.floor(month / 3) + 1;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const stockTicker = searchParams.get('ticker');
    const status = searchParams.get('status');

    // Get user's monitored stocks
    const subscriptionsSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const monitoredStocks = subscriptionsSnap.docs.map(doc => doc.data().stockTicker);

    if (monitoredStocks.length === 0) {
      return NextResponse.json({ queueItems: [] });
    }

    // Build query for content queue
    let queueQuery = db.collection('ai_content_queue')
      .where('stockTicker', 'in', monitoredStocks);

    if (stockTicker) {
      queueQuery = queueQuery.where('stockTicker', '==', stockTicker.toUpperCase());
    }

    if (status) {
      queueQuery = queueQuery.where('processingStatus', '==', status);
    }

    const queueSnap = await queueQuery
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const queueItems = queueSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ queueItems });
  } catch (error) {
    console.error('Error fetching AI content queue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 