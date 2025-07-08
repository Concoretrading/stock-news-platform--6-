import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const db = getFirestore();

// GET: Fetch website monitoring data
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Only allow admin access
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const stockTicker = searchParams.get('stockTicker');

    let query = db.collection('website_monitoring');

    if (stockTicker) {
      query = query.where('stockTicker', '==', stockTicker.toUpperCase()) as any;
    }

    const snapshot = await query.get();
    const websites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ websites });
  } catch (error) {
    console.error('Error fetching website monitoring:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add new website monitoring
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Only allow admin access
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { stockTicker, companyName, websiteUrl, scanFrequencyHours = 24 } = await request.json();

    if (!stockTicker || !companyName || !websiteUrl) {
      return NextResponse.json({ 
        error: 'Stock ticker, company name, and website URL are required' 
      }, { status: 400 });
    }

    // Check if website monitoring already exists for this stock
    const existingSnap = await db.collection('website_monitoring')
      .where('stockTicker', '==', stockTicker.toUpperCase())
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json({ 
        error: 'Website monitoring already exists for this stock' 
      }, { status: 409 });
    }

    // Create new website monitoring entry
    const websiteMonitoring = {
      stockTicker: stockTicker.toUpperCase(),
      companyName,
      websiteUrl,
      isActive: true,
      lastScanAt: null,
      lastContentHash: null,
      scanFrequencyHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByUserId: userId
    };

    const docRef = await db.collection('website_monitoring').add(websiteMonitoring);

    return NextResponse.json({ 
      id: docRef.id,
      ...websiteMonitoring,
      message: 'Website monitoring added successfully' 
    });
  } catch (error) {
    console.error('Error adding website monitoring:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update website monitoring
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Only allow admin access
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Website monitoring ID is required' }, { status: 400 });
    }

    // Update the website monitoring entry
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await db.collection('website_monitoring').doc(id).update(updateData);

    return NextResponse.json({ 
      message: 'Website monitoring updated successfully' 
    });
  } catch (error) {
    console.error('Error updating website monitoring:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove website monitoring
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Only allow admin access
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Website monitoring ID is required' }, { status: 400 });
    }

    // Delete the website monitoring entry
    await db.collection('website_monitoring').doc(id).delete();

    return NextResponse.json({ 
      message: 'Website monitoring removed successfully' 
    });
  } catch (error) {
    console.error('Error removing website monitoring:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 