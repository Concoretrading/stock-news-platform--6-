import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Firebase Admin connection...');
    
    // Test write
    const testRef = adminDb.collection('test').doc('connection-test');
    await testRef.set({
      timestamp: new Date().toISOString(),
      message: 'Firebase Admin connection successful!'
    });

    // Test read
    const doc = await testRef.get();
    const data = doc.data();

    return NextResponse.json({
      success: true,
      message: 'Firebase Admin test successful!',
      test_results: {
        write_success: true,
        read_success: true,
        data
      }
    });

  } catch (error) {
    console.error('Firebase Admin Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test Firebase Admin',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 