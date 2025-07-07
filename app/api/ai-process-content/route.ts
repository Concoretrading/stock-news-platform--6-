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

// Mock AI processing function (replace with real OpenAI API call)
async function simulateAIProcessing(content: string, stockTicker: string, contentType: string) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const events = [];
  let confidenceScore = 0.5;

  // Simple keyword-based event detection
  const lowerContent = content.toLowerCase();
  
  // Check for earnings-related content
  if (lowerContent.includes('earnings') || lowerContent.includes('quarterly results') || lowerContent.includes('financial results')) {
    events.push({
      type: 'earnings_call',
      title: `${stockTicker} Earnings Call`,
      description: 'Quarterly earnings announcement and conference call',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
      time: '16:30:00',
      confidence: 0.85
    });
    confidenceScore = Math.max(confidenceScore, 0.85);
  }

  // Check for product announcements
  if (lowerContent.includes('announce') || lowerContent.includes('launch') || lowerContent.includes('new product')) {
    events.push({
      type: 'product_announcement',
      title: `${stockTicker} Product Announcement`,
      description: 'New product or service announcement',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
      time: '14:00:00',
      confidence: 0.75
    });
    confidenceScore = Math.max(confidenceScore, 0.75);
  }

  // Check for conference events
  if (lowerContent.includes('conference') || lowerContent.includes('event') || lowerContent.includes('presentation')) {
    events.push({
      type: 'conference',
      title: `${stockTicker} Conference Event`,
      description: 'Company conference or presentation event',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
      time: '09:00:00',
      confidence: 0.70
    });
    confidenceScore = Math.max(confidenceScore, 0.70);
  }

  return {
    events,
    confidenceScore,
    processingTime: 1000,
    model: 'mock-ai-processor',
    version: '1.0'
  };
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