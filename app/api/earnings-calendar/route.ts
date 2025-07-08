import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/services/auth-service';
import { getEarningsCalendar, addEarningsEvent } from '@/lib/services/earnings-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Fetch earnings calendar data
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await verifyAuthToken(token);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate');
    const stockTicker = searchParams.get('stockTicker');

    const earnings = await getEarningsCalendar();

    return NextResponse.json({
      success: true,
      data: earnings
    });

  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch earnings data'
    }, { status: 500 });
  }
}

// POST: Update earnings calendar (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await verifyAuthToken(token);
      if (!decodedToken.admin) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
      }
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await request.json();
    await addEarningsEvent(data);

    return NextResponse.json({
      success: true,
      message: 'Earnings calendar updated successfully'
    });
  } catch (error) {
    console.error('Error updating earnings calendar:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update earnings calendar'
    }, { status: 500 });
  }
} 