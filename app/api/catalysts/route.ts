import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminStorage, adminDb } from "@/lib/firebase-admin"

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const db = adminDb

    const authHeader = request.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    let userId: string;

    // Development bypass for localhost
    if (idToken === 'dev-token-localhost') {
      userId = 'test-user-localhost';
      console.log('🔧 Development mode - using test user for catalysts GET');
    } else {
      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
      } catch (err) {
        return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
      }
      userId = decodedToken.uid;
    }

    const { searchParams } = new URL(request.url)
    const ticker = searchParams.get("ticker")

    let catalystsSnap
    if (ticker) {
      // Query catalysts for this user and specific ticker
      catalystsSnap = await db.collection("catalysts")
        .where("userId", "==", userId)
        .where("stockTickers", "array-contains", ticker.toUpperCase())
        .orderBy("date", "desc")
        .get()
    } else {
      // Query all catalysts for this user
      catalystsSnap = await db.collection("catalysts")
        .where("userId", "==", userId)
        .orderBy("date", "desc")
        .get()
    }

    const catalysts = catalystsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .filter((c: any) => {
        const cat = c as any;
        return cat && cat.id && cat.description && cat.isManual === true;
      })
      .map((c: any) => ({
        ...c,
        id: typeof c.id === 'string' ? c.id : (c.id && typeof c.id === 'object' && typeof c.id.toString === 'function' ? c.id.toString() : String(c.id)),
      }));

    return NextResponse.json({ success: true, data: catalysts })
  } catch (error) {
    console.error("Error in GET /api/catalysts:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = adminDb

    const authHeader = request.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    let userId: string;

    // Development bypass for localhost
    if (idToken === 'dev-token-localhost') {
      userId = 'test-user-localhost';
      console.log('🔧 Development mode - using test user for catalysts POST');
    } else {
      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
      } catch (err) {
        return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
      }
      userId = decodedToken.uid;
    }

    const body = await request.json()
    const { ticker, headline, notes, priceBefore, priceAfter, catalystDate, imageUrl } = body
    if (!ticker || !headline || !catalystDate) {
      return NextResponse.json({ success: false, error: "Ticker, headline, and date are required." }, { status: 400 })
    }
    const normalizedDate = new Date(catalystDate)
    if (isNaN(normalizedDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid date format." }, { status: 400 })
    }

    // Insert the catalyst
    const catalystDoc = await db.collection("catalysts").add({
      userId,
      stockTickers: [ticker.toUpperCase()],
      title: headline,
      description: notes || null,
      date: normalizedDate.toISOString().split("T")[0],
      imageUrl: imageUrl || null,
      isManual: true,
      createdAt: new Date().toISOString(),
      priceBefore: priceBefore ? Number(priceBefore) : null,
      priceAfter: priceAfter ? Number(priceAfter) : null,
    })

    const newCatalyst = (await catalystDoc.get()).data()
    return NextResponse.json({ success: true, data: { id: catalystDoc.id, ...newCatalyst } })
  } catch (error) {
    console.error("Error in POST /api/catalysts:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = adminDb

    const authHeader = request.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    let userId: string;

    // Development bypass for localhost
    if (idToken === 'dev-token-localhost') {
      userId = 'test-user-localhost';
    } else {
      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
      } catch (err) {
        return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
      }
      userId = decodedToken.uid;
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ success: false, error: "ID parameter is required" }, { status: 400 })
    }

    const docRef = db.collection("catalysts").doc(id)
    const docSnap = await docRef.get()
    if (!docSnap.exists) {
      return NextResponse.json({ success: false, error: "Catalyst not found" }, { status: 404 })
    }
    const catalyst = docSnap.data()
    if (!catalyst || catalyst.userId !== userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    // Delete image from Firebase Storage if it exists
    if (catalyst.imageUrl) {
      try {
        const bucket = adminStorage.bucket()
        const url = new URL(catalyst.imageUrl)
        const pathStart = url.pathname.indexOf("/") + 1
        const filePath = url.pathname.substring(pathStart)
        await bucket.file(filePath).delete()
      } catch (err) {
        console.error("Error deleting image from storage:", err)
      }
    }

    await docRef.delete()
    return NextResponse.json({ success: true, message: "Catalyst and image deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/catalysts:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
