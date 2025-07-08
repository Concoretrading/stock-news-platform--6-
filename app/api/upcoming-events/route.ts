import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getFirestore } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Fetch upcoming events and catalysts
export async function GET(request: NextRequest) {
  try {
    const db = getFirestore();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const stockTicker = searchParams.get('ticker');

    // Simple mock upcoming events data
    const events = [
      {
        id: '1',
        title: 'Apple Q1 2024 Earnings',
        date: '2024-01-25',
        type: 'earnings',
        ticker: 'AAPL',
        description: 'Quarterly earnings announcement'
      },
      {
        id: '2',
        title: 'Tesla Vehicle Delivery Numbers',
        date: '2024-01-02', 
        type: 'announcement',
        ticker: 'TSLA',
        description: 'Q4 delivery numbers release'
      }
    ];

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