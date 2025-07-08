import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/services/auth-service';
import { getAIDataSources } from '@/lib/services/ai-service';

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
    const decodedToken = await verifyAdminToken(token);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const stockTicker = searchParams.get('ticker');
    const sourceType = searchParams.get('type');

    const sources = await getAIDataSources(userId, stockTicker || undefined, sourceType || undefined);

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Error fetching AI data sources:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 