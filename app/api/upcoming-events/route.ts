import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingEvents } from '@/lib/services/events-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Fetch upcoming events and catalysts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const stockTicker = searchParams.get('ticker');

    const events = await getUpcomingEvents(stockTicker, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: events,
      message: 'Events fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch upcoming events'
    }, { status: 500 });
  }
} 