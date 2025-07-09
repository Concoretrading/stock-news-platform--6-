import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Vision API setup...');
    
    // Test 1: Check if credentials file exists
    const fs = require('fs');
    const path = require('path');
    const credentialsPath = path.join(process.cwd(), 'concorenews-firebase-adminsdk.json');
    
    if (!fs.existsSync(credentialsPath)) {
      return NextResponse.json({
        success: false,
        error: 'Credentials file not found',
        path: credentialsPath
      });
    }
    
    console.log('✅ Credentials file exists at:', credentialsPath);
    
    // Test 2: Try to import Vision API
    try {
      const { ImageAnnotatorClient } = await import('@google-cloud/vision');
      console.log('✅ Google Vision API package imported successfully');
      
      // Test 3: Try to initialize client
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      console.log('✅ Credentials parsed, project ID:', credentials.project_id);
      
      const vision = new ImageAnnotatorClient({
        credentials: credentials,
        projectId: credentials.project_id
      });
      
      console.log('✅ Vision client created successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Google Vision API is properly configured',
        projectId: credentials.project_id,
        credentialsPath: credentialsPath
      });
      
    } catch (importError) {
      console.error('❌ Failed to import or initialize Vision API:', importError);
      return NextResponse.json({
        success: false,
        error: 'Failed to import or initialize Vision API',
        details: importError instanceof Error ? importError.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('❌ Vision API test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Vision API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 