import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const runtime = 'nodejs';

// Disable body parsing for file uploads
export const dynamic = 'force-dynamic';

const LOGO_DIR = path.join(process.cwd(), 'public/images/logos');
const TICKERS_JSON = path.join(process.cwd(), 'lib/tickers.json');

export async function POST(req: NextRequest) {
  try {
    console.log('Upload route called');
    
    // Parse form data
    const formData = await req.formData();
    console.log('Form data parsed');
    
    const ticker = formData.get('ticker') as string;
    const file = formData.get('file') as File;
    
    console.log('Ticker:', ticker, 'File:', file?.name, 'Size:', file?.size);
    
    if (!ticker || !file) {
      return NextResponse.json({ 
        error: 'Missing ticker or file' 
      }, { status: 400 });
    }
    
    const tickerUpper = ticker.toUpperCase();
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Only image files allowed' 
      }, { status: 400 });
    }
    
    // Ensure logo directory exists
    if (!fs.existsSync(LOGO_DIR)) {
      fs.mkdirSync(LOGO_DIR, { recursive: true });
    }
    
    const outPath = path.join(LOGO_DIR, `${tickerUpper}.png`);
    console.log('Output path:', outPath);
    
    // Convert File to Buffer and resize
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('Buffer created, size:', buffer.length);
    
    // Resize and save image
    await sharp(buffer)
      .resize(64, 64, { fit: 'cover' })
      .png()
      .toFile(outPath);
    
    console.log('Image processed and saved');
    
    // Update tickers.json
    let tickers = [];
    if (fs.existsSync(TICKERS_JSON)) {
      const tickersData = fs.readFileSync(TICKERS_JSON, 'utf8');
      tickers = JSON.parse(tickersData);
    }
    
    // Find and update existing ticker or add new one
    let found = false;
    for (const t of tickers) {
      if (t.ticker.toUpperCase() === tickerUpper) {
        t.logoUrl = `/images/logos/${tickerUpper}.png`;
        found = true;
        break;
      }
    }
    
    if (!found) {
      tickers.push({ 
        ticker: tickerUpper, 
        logoUrl: `/images/logos/${tickerUpper}.png` 
      });
    }
    
    // Write updated tickers.json
    fs.writeFileSync(TICKERS_JSON, JSON.stringify(tickers, null, 2));
    console.log('Tickers.json updated');
    
    return NextResponse.json({ 
      success: true, 
      logoUrl: `/images/logos/${tickerUpper}.png`,
      ticker: tickerUpper
    });
    
  } catch (err: any) {
    console.error('Logo upload error:', err);
    return NextResponse.json({ 
      error: err.message || 'Upload failed' 
    }, { status: 500 });
  }
} 