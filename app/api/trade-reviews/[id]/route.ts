import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getFirestore } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get the trade review
    const reviewDoc = await db.collection('trade_reviews').doc(params.id).get();
    
    if (!reviewDoc.exists) {
      return NextResponse.json({ error: "Trade review not found" }, { status: 404 });
    }

    const reviewData = reviewDoc.data();
    
    // Check if user owns this review
    if (reviewData?.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get sections for this review
    const sectionsSnapshot = await db.collection('trade_review_sections')
      .where('tradeReviewId', '==', params.id)
      .orderBy('sectionOrder')
      .get();

    const sections = [];

    for (const sectionDoc of sectionsSnapshot.docs) {
      const sectionData = sectionDoc.data();
      
      // Get images for this section
      const imagesSnapshot = await db.collection('trade_review_images')
        .where('sectionId', '==', sectionDoc.id)
        .orderBy('imageOrder')
        .get();

      const images = imagesSnapshot.docs.map(imgDoc => ({
        id: imgDoc.id,
        ...imgDoc.data()
      }));

      sections.push({
        id: sectionDoc.id,
        sectionName: sectionData.sectionName,
        content: sectionData.content,
        images
      });
    }

    const tradeReview = {
      id: reviewDoc.id,
      ...reviewData,
      sections
    };

    return NextResponse.json({
      success: true,
      data: tradeReview
    });

  } catch (error) {
    console.error('Error fetching trade review:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to fetch trade review"
    }, { status: 500 });
  }
} 