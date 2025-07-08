import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getFirestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (admin only)
    const authHeader = request.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await (await getAuth()).verifyIdToken(idToken);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Only allow admin user
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { events } = await request.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    const db = await getFirestore();
    const batch = db.batch();

    // Save each earnings event to Firestore
    for (const event of events) {
      const earningsRef = db.collection('earnings_calendar').doc();
      batch.set(earningsRef, {
        ...event,
        uploadedBy: decodedToken.email,
        uploadedAt: new Date().toISOString(),
        isPublic: true, // Make visible to all users
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${events.length} earnings events`,
      eventsCount: events.length
    });

  } catch (error) {
    console.error('Error saving earnings events:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save earnings events'
    }, { status: 500 });
  }
} 