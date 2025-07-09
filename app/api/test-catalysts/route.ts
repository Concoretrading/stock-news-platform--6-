import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = await getFirestore();
    
    // Get ALL catalysts for the test user to see what's stored
    const allCatalystsSnap = await db.collection('catalysts')
      .where('userId', '==', 'test-user-localhost')
      .get();
    
    const allCatalysts = allCatalystsSnap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    console.log(`Found ${allCatalysts.length} total catalysts for test-user-localhost`);
    
    // Also test the exact query used by the catalysts API
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    
    let filteredCatalysts: any[] = [];
    if (ticker) {
      const filteredSnap = await db.collection('catalysts')
        .where('userId', '==', 'test-user-localhost')
        .where('stockTickers', 'array-contains', ticker.toUpperCase())
        .orderBy('date', 'desc')
        .get();
      
      filteredCatalysts = filteredSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      console.log(`Found ${filteredCatalysts.length} catalysts for ticker ${ticker}`);
    }
    
    return NextResponse.json({
      success: true,
      totalCatalysts: allCatalysts.length,
      allCatalysts: allCatalysts,
      ticker: ticker || 'none',
      filteredCatalysts: filteredCatalysts,
      filteredCount: filteredCatalysts.length
    });
    
  } catch (error) {
    console.error('Error testing catalysts:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 