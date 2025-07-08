import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/services/auth-service';
import { getAIMonitoringSubscriptions, addAIMonitoringSubscription, removeAIMonitoringSubscription } from '@/lib/services/ai-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyAuthToken(token);
    const userId = decodedToken.uid;

    const subscriptions = await getAIMonitoringSubscriptions(userId);

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching AI monitoring subscriptions:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyAuthToken(token);
    const userId = decodedToken.uid;

    const { stockTicker } = await request.json();

    if (!stockTicker) {
      return NextResponse.json({ error: 'Stock ticker is required' }, { status: 400 });
    }

    const result = await addAIMonitoringSubscription(userId, stockTicker);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error adding AI monitoring subscription:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyAuthToken(token);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const stockTicker = searchParams.get('ticker');

    if (!stockTicker) {
      return NextResponse.json({ error: 'Stock ticker is required' }, { status: 400 });
    }

    const result = await removeAIMonitoringSubscription(userId, stockTicker);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error removing AI monitoring subscription:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 