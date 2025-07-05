import { type NextRequest, NextResponse } from "next/server"
import { getAuth, getStorage } from "@/lib/firebase-admin"
import { getFirestore } from "firebase-admin/firestore"

const db = getFirestore()

// Log the default bucket name for debugging
console.log('Firebase Admin initialized with bucket:', getStorage().bucket().name);

export async function POST(request: NextRequest) {
  // Log the Authorization header and ID token for debugging
  const authHeader = request.headers.get("authorization") || ""
  console.log("Backend Authorization Header:", authHeader)
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
  console.log("Backend ID Token:", idToken)
  try {
    // 1. Extract Firebase ID token from Authorization header
    if (!idToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    // Verify Firebase ID token
    console.log("About to verify token");
    let decodedToken
    try {
      decodedToken = await getAuth().verifyIdToken(idToken)
      console.log("Token verified successfully");
    } catch (err) {
      let errorMessage = '';
      if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as any).message;
      } else {
        errorMessage = JSON.stringify(err);
      }
      console.log("Token verification error (string):", errorMessage);
      console.error("Token verification error (object):", err);
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }
    const userId = decodedToken.uid
    console.log("User ID:", userId);

    // 2. Get user's watchlist (tickers) from Firestore
    const stocksSnap = await db.collection("stocks")
      .where("userId", "==", userId)
      .get()
    const watchlistTickers = stocksSnap.docs.map(doc => doc.data().ticker?.toUpperCase()).slice(0, 10)
    console.log("User watchlist tickers:", watchlistTickers);

    // 3. Continue with screenshot analysis as before
    const formData = await request.formData()
    const image = formData.get("image") as File
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }
    console.log("Image received:", { name: image.name, type: image.type, size: image.size });
    
    // Convert image to buffer
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    // Upload image to Firebase Storage
    const storage = getStorage()
    const fileName = `screenshot-news-images/${userId}_${Date.now()}.${image.type.split('/').pop() || 'png'}`
    const bucket = storage.bucket() // Use default bucket from initialization
    const file = bucket.file(fileName)
    await file.save(buffer, { contentType: image.type })
    // Do NOT make the file public
    // Store the storage path for use with getDownloadURL
    const imageStoragePath = fileName
    console.log("Image uploaded to storage:", imageStoragePath);
    
    // Call Google Cloud Function for OCR processing
    const cloudFunctionUrl = process.env.GOOGLE_CLOUD_FUNCTION_URL
    if (!cloudFunctionUrl) {
      return NextResponse.json({ error: "Google Cloud Function URL not configured" }, { status: 500 })
    }
    const ocrResponse = await fetch(cloudFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData: buffer.toString('base64'), imageType: image.type }),
    })
    if (!ocrResponse.ok) {
      throw new Error(`OCR processing failed: ${ocrResponse.status}`)
    }
    const ocrResult = await ocrResponse.json()
    if (!ocrResult.success) {
      throw new Error(ocrResult.error || 'OCR processing failed')
    }
    // Debug log: OCR matches
    console.log('OCR matches:', ocrResult.matches)
    // 4. Filter matches to only those in user's watchlist
    const filteredMatches = (ocrResult.matches || []).filter((m: any) => watchlistTickers.includes(m.ticker?.toUpperCase()))
    // Debug log: Filtered matches
    console.log('Filtered matches (in watchlist):', filteredMatches)
    
    // 5. Enhanced date handling with timezone awareness
    const now = new Date();
    const utcDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const todayIso = utcDate.toISOString().split("T")[0];
    
    // Log date information for debugging
    console.log("Date handling:", {
      localTime: now.toISOString(),
      utcTime: utcDate.toISOString(),
      todayIso: todayIso,
      timezoneOffset: now.getTimezoneOffset(),
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    // 6. Log news entries for filtered tickers in Firestore
    const newsEntryResults: any[] = []
    for (const match of filteredMatches) {
      try {
        const catalystData = {
          userId,
          stockTickers: [match.ticker.toUpperCase()],
          title: ocrResult.headline || ocrResult.text?.substring(0, 100) || "Screenshot Catalyst",
          description: ocrResult.extractedText || ocrResult.text || null,
          date: todayIso,
          imageUrl: imageStoragePath,
          isManual: false,
          createdAt: new Date().toISOString(),
        };
        
        console.log("Creating catalyst entry:", catalystData);
        
        const catalystDoc = await db.collection("catalysts").add(catalystData)
        newsEntryResults.push({ ticker: match.ticker, id: catalystDoc.id, success: true })
        // Debug log: Firestore write success
        console.log('Catalyst written to Firestore:', { 
          ticker: match.ticker, 
          id: catalystDoc.id, 
          date: todayIso,
          createdAt: catalystData.createdAt
        })
      } catch (error) {
        newsEntryResults.push({ ticker: match.ticker, success: false, error: error instanceof Error ? error.message : "Unknown error" })
        // Debug log: Firestore write error
        console.error('Error writing catalyst to Firestore:', error)
      }
    }
    
    console.log("Screenshot analysis completed:", {
      totalMatches: ocrResult.matches?.length || 0,
      filteredMatches: filteredMatches.length,
      successfulEntries: newsEntryResults.filter(r => r.success).length,
      failedEntries: newsEntryResults.filter(r => !r.success).length,
      dateUsed: todayIso
    });
    
    return NextResponse.json({
      ...ocrResult,
      matches: filteredMatches,
      newsEntryResults,
      imageUrl: imageStoragePath,
      dateUsed: todayIso, // Include the date used for debugging
    })
  } catch (error) {
    console.error("Screenshot analysis error:", error)
    return NextResponse.json({ 
      error: "Failed to analyze screenshot",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
