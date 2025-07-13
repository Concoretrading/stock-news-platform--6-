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

export async function PUT(
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
    
    // Check if review exists and user owns it
    const reviewDoc = await db.collection('trade_reviews').doc(params.id).get();
    
    if (!reviewDoc.exists) {
      return NextResponse.json({ error: "Trade review not found" }, { status: 404 });
    }

    const reviewData = reviewDoc.data();
    if (reviewData?.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { ticker, tradeDate, positionType, sections } = body;

    if (!ticker || !tradeDate || !positionType || !sections) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update the trade review
    const updateData = {
      ticker: ticker.toUpperCase(),
      tradeDate,
      positionType: positionType.toUpperCase(),
      totalSections: sections.length,
      updatedAt: new Date()
    };

    await db.collection('trade_reviews').doc(params.id).update(updateData);

    // Delete existing sections and images
    const existingSections = await db.collection('trade_review_sections')
      .where('tradeReviewId', '==', params.id)
      .get();

    for (const sectionDoc of existingSections.docs) {
      // Delete images for this section
      const images = await db.collection('trade_review_images')
        .where('sectionId', '==', sectionDoc.id)
        .get();
      
      for (const imageDoc of images.docs) {
        await imageDoc.ref.delete();
      }
      
      // Delete the section
      await sectionDoc.ref.delete();
    }

    // Create new sections
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionData = {
        tradeReviewId: params.id,
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
      data: { id: params.id, ...updateData }
    });

  } catch (error) {
    console.error('Error updating trade review:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to update trade review"
    }, { status: 500 });
  }
}

export async function DELETE(
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
    
    // Check if review exists and user owns it
    const reviewDoc = await db.collection('trade_reviews').doc(params.id).get();
    
    if (!reviewDoc.exists) {
      return NextResponse.json({ error: "Trade review not found" }, { status: 404 });
    }

    const reviewData = reviewDoc.data();
    if (reviewData?.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete all sections and their images
    const sections = await db.collection('trade_review_sections')
      .where('tradeReviewId', '==', params.id)
      .get();

    for (const sectionDoc of sections.docs) {
      // Delete images for this section
      const images = await db.collection('trade_review_images')
        .where('sectionId', '==', sectionDoc.id)
        .get();
      
      for (const imageDoc of images.docs) {
        await imageDoc.ref.delete();
      }
      
      // Delete the section
      await sectionDoc.ref.delete();
    }

    // Delete the main review
    await db.collection('trade_reviews').doc(params.id).delete();

    return NextResponse.json({
      success: true,
      message: "Trade review deleted successfully"
    });

  } catch (error) {
    console.error('Error deleting trade review:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to delete trade review"
    }, { status: 500 });
  }
} 