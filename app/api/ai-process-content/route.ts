import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/services/auth-service';
import { processContent } from '@/lib/services/ai-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyAdminToken(token);
    const userId = decodedToken.uid;

    const data = await request.json();
    const result = await processContent(userId, data);

    return NextResponse.json({ 
      success: true,
      ...result,
      message: 'Content processed successfully' 
    });
  } catch (error) {
    console.error('Error in content processing:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process content'
    }, { status: 500 });
  }
} 