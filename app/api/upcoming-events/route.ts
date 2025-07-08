import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export const dynamic = 'force-dynamic';
export const runtime = 'edge';
export const revalidate = 0;

// GET: Fetch upcoming events and catalysts
export async function GET() {
  try {
    // Return empty data for static generation
    return new NextResponse(JSON.stringify({
      success: true,
      data: [],
      message: 'Static generation placeholder'
    }), {
      headers: {
        'content-type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return new NextResponse(JSON.stringify({
      success: false,
      error: 'Failed to fetch upcoming events'
    }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      }
    });
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