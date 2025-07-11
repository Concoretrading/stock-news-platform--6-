import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    
    if (!idToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let userId: string;
    
    // Development bypass for localhost
    if (idToken === 'dev-token-localhost') {
      userId = 'test-user-localhost';
    } else {
      let decodedToken;
      try {
        decodedToken = await (await getAuth()).verifyIdToken(idToken);
      } catch (err) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
      }
      userId = decodedToken.uid;
    }

    const db = await getFirestore();
    
    // Get user's trade reviews
    const reviewsSnapshot = await db.collection('trade_reviews')
      .where('userId', '==', userId)
      .where('isTemplate', '==', false)
      .orderBy('createdAt', 'desc')
      .get();

    const reviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error('Error fetching trade reviews:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to fetch trade reviews"
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    
    if (!idToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let userId: string;
    
    // Development bypass for localhost
    if (idToken === 'dev-token-localhost') {
      userId = 'test-user-localhost';
    } else {
      let decodedToken;
      try {
        decodedToken = await (await getAuth()).verifyIdToken(idToken);
      } catch (err) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
      }
      userId = decodedToken.uid;
    }

    const body = await request.json();
    const { ticker, tradeDate, positionType, sections } = body;

    if (!ticker || !tradeDate || !positionType || !sections) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getFirestore();
    
    // Create the trade review
    const reviewData = {
      userId,
      ticker: ticker.toUpperCase(),
      tradeDate,
      positionType: positionType.toUpperCase(),
      status: 'draft',
      totalSections: sections.length,
      isTemplate: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const reviewRef = await db.collection('trade_reviews').add(reviewData);

    // Create sections
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionData = {
        tradeReviewId: reviewRef.id,
        sectionName: section.name,
        sectionOrder: i + 1,
        content: section.content || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const sectionRef = await db.collection('trade_review_sections').add(sectionData);

      // Add images for this section
      if (section.images && section.images.length > 0) {
        for (let j = 0; j < section.images.length; j++) {
          const image = section.images[j];
          const imageData = {
            sectionId: sectionRef.id,
            imageUrl: image.url,
            imageOrder: j + 1,
            altText: image.altText || '',
            createdAt: new Date()
          };

          await db.collection('trade_review_images').add(imageData);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: reviewRef.id, ...reviewData }
    });

  } catch (error) {
    console.error('Error creating trade review:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to create trade review"
    }, { status: 500 });
  }
} 