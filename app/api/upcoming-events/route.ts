import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// GET: Fetch upcoming events and catalysts
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const stockTicker = searchParams.get('stockTicker');
    const monthsAhead = parseInt(searchParams.get('monthsAhead') || '6');
    const eventType = searchParams.get('eventType'); // 'earnings', 'product_launch', 'conference', 'regulatory', 'ai_detected'

    // Calculate date range (current date to X months ahead)
    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsAhead);
    const endDateISO = endDate.toISOString();

    let events: any[] = [];

    // 1. Get upcoming earnings (confirmed and estimated)
    const earningsEvents = await getUpcomingEarnings(stockTicker, startDate, endDateISO);
    events.push(...earningsEvents);

    // 2. Get AI detected events
    const aiEvents = await getAIDetectedEvents(stockTicker, startDate, endDateISO);
    events.push(...aiEvents);

    // 3. Get product launches and company events
    const companyEvents = await getCompanyEvents(stockTicker, startDate, endDateISO);
    events.push(...companyEvents);

    // 4. Get regulatory events
    const regulatoryEvents = await getRegulatoryEvents(stockTicker, startDate, endDateISO);
    events.push(...regulatoryEvents);

    // 5. Get conference and presentation events
    const conferenceEvents = await getConferenceEvents(stockTicker, startDate, endDateISO);
    events.push(...conferenceEvents);

    // Sort all events by date
    events.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    // Filter by event type if specified
    if (eventType) {
      events = events.filter(event => event.eventType === eventType);
    }

    return NextResponse.json({ 
      events,
      total: events.length,
      dateRange: { startDate, endDate: endDateISO },
      monthsAhead
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getUpcomingEarnings(stockTicker: string | null, startDate: string, endDate: string) {
  try {
    let query = db.collection('earnings_calendar')
      .where('earningsDate', '>=', startDate)
      .where('earningsDate', '<=', endDate);

    if (stockTicker) {
      query = query.where('stockTicker', '==', stockTicker.toUpperCase()) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        eventType: 'earnings',
        eventDate: data.earningsDate,
        title: `${data.stockTicker} Q${getQuarterFromDate(data.earningsDate)} Earnings`,
        description: `${data.companyName} ${data.earningsType} earnings call`,
        stockTicker: data.stockTicker,
        companyName: data.companyName,
        earningsType: data.earningsType,
        isConfirmed: data.isConfirmed,
        estimatedEPS: data.estimatedEPS,
        estimatedRevenue: data.estimatedRevenue,
        conferenceCallUrl: data.conferenceCallUrl,
        confidence: data.isConfirmed ? 0.95 : 0.70,
        source: 'earnings_calendar',
        category: 'Earnings',
        impact: 'high',
        daysUntil: Math.ceil((new Date(data.earningsDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      };
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return [];
  }
}

async function getAIDetectedEvents(stockTicker: string | null, startDate: string, endDate: string) {
  try {
    let query = db.collection('ai_detected_events')
      .where('eventDate', '>=', startDate)
      .where('eventDate', '<=', endDate);

    if (stockTicker) {
      query = query.where('stockTicker', '==', stockTicker.toUpperCase()) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        eventType: data.eventType,
        eventDate: data.eventDate,
        title: data.title,
        description: data.description,
        stockTicker: data.stockTicker,
        confidence: data.confidenceScore,
        source: data.sourceType,
        category: getCategoryFromEventType(data.eventType),
        impact: getImpactFromConfidence(data.confidenceScore),
        daysUntil: Math.ceil((new Date(data.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      };
    });
  } catch (error) {
    console.error('Error fetching AI events:', error);
    return [];
  }
}

async function getCompanyEvents(stockTicker: string | null, startDate: string, endDate: string) {
  // Mock company events - in production, this would come from company calendars, press releases, etc.
  const mockCompanyEvents = [
    {
      eventType: 'product_launch',
      eventDate: '2024-09-10T14:00:00Z',
      title: 'Apple iPhone 16 Launch Event',
      description: 'Expected iPhone 16 series launch with new AI features',
      stockTicker: 'AAPL',
      confidence: 0.85,
      source: 'company_calendar',
      category: 'Product Launch',
      impact: 'high',
      daysUntil: Math.ceil((new Date('2024-09-10T14:00:00Z').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    },
    {
      eventType: 'product_launch',
      eventDate: '2024-10-15T16:00:00Z',
      title: 'Tesla Cybertruck Production Update',
      description: 'Major Cybertruck production milestone and delivery update',
      stockTicker: 'TSLA',
      confidence: 0.80,
      source: 'company_calendar',
      category: 'Product Launch',
      impact: 'high',
      daysUntil: Math.ceil((new Date('2024-10-15T16:00:00Z').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    },
    {
      eventType: 'conference',
      eventDate: '2024-11-18T09:00:00Z',
      title: 'NVIDIA GTC 2024 Conference',
      description: 'Annual GPU Technology Conference with new AI chip announcements',
      stockTicker: 'NVDA',
      confidence: 0.90,
      source: 'company_calendar',
      category: 'Conference',
      impact: 'high',
      daysUntil: Math.ceil((new Date('2024-11-18T09:00:00Z').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }
  ];

  if (stockTicker) {
    return mockCompanyEvents.filter(event => event.stockTicker === stockTicker.toUpperCase());
  }
  return mockCompanyEvents;
}

async function getRegulatoryEvents(stockTicker: string | null, startDate: string, endDate: string) {
  // Mock regulatory events - in production, this would come from SEC filings, regulatory calendars, etc.
  const mockRegulatoryEvents = [
    {
      eventType: 'regulatory',
      eventDate: '2024-08-15T10:00:00Z',
      title: 'AAPL Antitrust Hearing',
      description: 'Congressional hearing on Apple App Store practices',
      stockTicker: 'AAPL',
      confidence: 0.75,
      source: 'regulatory_calendar',
      category: 'Regulatory',
      impact: 'medium',
      daysUntil: Math.ceil((new Date('2024-08-15T10:00:00Z').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    },
    {
      eventType: 'regulatory',
      eventDate: '2024-09-30T14:00:00Z',
      title: 'TSLA Safety Review',
      description: 'NHTSA review of Tesla Autopilot safety features',
      stockTicker: 'TSLA',
      confidence: 0.70,
      source: 'regulatory_calendar',
      category: 'Regulatory',
      impact: 'medium',
      daysUntil: Math.ceil((new Date('2024-09-30T14:00:00Z').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }
  ];

  if (stockTicker) {
    return mockRegulatoryEvents.filter(event => event.stockTicker === stockTicker.toUpperCase());
  }
  return mockRegulatoryEvents;
}

async function getConferenceEvents(stockTicker: string | null, startDate: string, endDate: string) {
  // Mock conference events - in production, this would come from conference calendars, company presentations, etc.
  const mockConferenceEvents = [
    {
      eventType: 'conference',
      eventDate: '2024-07-25T09:00:00Z',
      title: 'Apple WWDC 2024',
      description: 'Apple Worldwide Developers Conference with iOS 18 announcements',
      stockTicker: 'AAPL',
      confidence: 0.95,
      source: 'conference_calendar',
      category: 'Conference',
      impact: 'high',
      daysUntil: Math.ceil((new Date('2024-07-25T09:00:00Z').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    },
    {
      eventType: 'conference',
      eventDate: '2024-08-12T10:00:00Z',
      title: 'Tesla Battery Day 2024',
      description: 'Tesla battery technology updates and new product announcements',
      stockTicker: 'TSLA',
      confidence: 0.85,
      source: 'conference_calendar',
      category: 'Conference',
      impact: 'high',
      daysUntil: Math.ceil((new Date('2024-08-12T10:00:00Z').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }
  ];

  if (stockTicker) {
    return mockConferenceEvents.filter(event => event.stockTicker === stockTicker.toUpperCase());
  }
  return mockConferenceEvents;
}

// Helper functions
function getQuarterFromDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth();
  if (month >= 0 && month <= 2) return '1';
  if (month >= 3 && month <= 5) return '2';
  if (month >= 6 && month <= 8) return '3';
  return '4';
}

function getCategoryFromEventType(eventType: string): string {
  const categories: { [key: string]: string } = {
    'earnings_call': 'Earnings',
    'product_announcement': 'Product Launch',
    'conference': 'Conference',
    'regulatory_filing': 'Regulatory',
    'analyst_event': 'Analyst Event'
  };
  return categories[eventType] || 'Other';
}

function getImpactFromConfidence(confidence: number): string {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
} 