import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const runtime = 'nodejs';

const LOGO_DIR = path.join(process.cwd(), 'public/images/logos');
const TICKERS_JSON = path.join(process.cwd(), 'lib/tickers.json');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const ticker = formData.get('ticker') as string;
    const file = formData.get('file') as File;
    
    if (!ticker || !file) {
      return NextResponse.json({ error: 'Missing ticker or file' }, { status: 400 });
    }
    
    const tickerUpper = ticker.toUpperCase();
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files allowed' }, { status: 400 });
    }
    
    // Ensure logo dir exists
    if (!fs.existsSync(LOGO_DIR)) {
      fs.mkdirSync(LOGO_DIR, { recursive: true });
    }
    
    const outPath = path.join(LOGO_DIR, `${tickerUpper}.png`);
    
    // Convert File to Buffer and resize
    const buffer = Buffer.from(await file.arrayBuffer());
    await sharp(buffer)
      .resize(64, 64, { fit: 'cover' })
      .png()
      .toFile(outPath);
    
    // Update tickers.json
    let tickers = [];
    if (fs.existsSync(TICKERS_JSON)) {
      tickers = JSON.parse(fs.readFileSync(TICKERS_JSON, 'utf8'));
    }
    
    let found = false;
    for (const t of tickers) {
      if (t.ticker.toUpperCase() === tickerUpper) {
        t.logoUrl = `/images/logos/${tickerUpper}.png`;
        found = true;
        break;
      }
    }
    
    if (!found) {
      tickers.push({ ticker: tickerUpper, logoUrl: `/images/logos/${tickerUpper}.png` });
    }
    
    fs.writeFileSync(TICKERS_JSON, JSON.stringify(tickers, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      logoUrl: `/images/logos/${tickerUpper}.png` 
    });
    
  } catch (err: any) {
    console.error('Logo upload error:', err);
    return NextResponse.json({ 
      error: err.message || 'Upload failed' 
    }, { status: 500 });
  }
} 