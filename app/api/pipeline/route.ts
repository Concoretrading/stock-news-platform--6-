import { NextRequest, NextResponse } from 'next/server';
import { updatePriceAndCheckAlerts } from '@/lib/services/pipeline-service';

export async function POST(request: NextRequest) {
  try {
    const { ticker, price } = await request.json();
    const result = await updatePriceAndCheckAlerts(ticker, price);

    return NextResponse.json({ 
      success: true,
      ...result,
      message: 'Pipeline executed successfully'
    });
  } catch (error) {
    console.error('Error in pipeline:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Pipeline execution failed'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'Pipeline endpoint is up.' });
} 