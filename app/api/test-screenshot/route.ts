import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing screenshot upload without Vision API...');
    
    const authHeader = request.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let userId: string;
    
    // Development bypass for localhost
    if (idToken === 'dev-token-localhost') {
      userId = 'test-user-localhost';
      console.log('✅ Development mode - using test user');
    } else {
      return NextResponse.json({ error: "Production auth not implemented in test" }, { status: 401 });
    }

    // Process the file upload
    const formData = await request.formData();
    const image = formData.get("image") as File;
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    console.log('📁 File received:', {
      name: image.name,
      type: image.type,
      size: image.size
    });

    // Convert image to buffer (this should work)
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('✅ Buffer created, size:', buffer.length);

    return NextResponse.json({
      success: true,
      message: 'File upload test successful - Vision API not called',
      fileInfo: {
        name: image.name,
        type: image.type,
        size: image.size,
        bufferSize: buffer.length
      },
      userId: userId
    });
    
  } catch (error) {
    console.error("❌ Test screenshot upload error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to process test upload",
    }, { status: 500 });
  }
} 