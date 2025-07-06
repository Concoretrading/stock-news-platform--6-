import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received /api/pipeline POST:', body);
    // TODO: Add your price update or alert logic here
    return NextResponse.json({ success: true, message: 'Pipeline endpoint received your request.', data: body });
  } catch (error) {
    console.error('Error in /api/pipeline:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'Pipeline endpoint is up.' });
} 