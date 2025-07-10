import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

const LOGO_DIR = path.join(process.cwd(), 'public/images/logos');
const TICKERS_JSON = path.join(process.cwd(), 'lib/tickers.json');

async function parseForm(req: NextRequest) {
  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req as any, (err: Error | null, fields: any, files: any) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    // Parse form data
    const { fields, files } = await parseForm(req);
    let tickerRaw = fields.ticker;
    if (Array.isArray(tickerRaw)) tickerRaw = tickerRaw[0];
    const ticker: string = typeof tickerRaw === 'string' ? tickerRaw.toUpperCase() : '';
    let fileRaw = files.logo;
    if (Array.isArray(fileRaw)) fileRaw = fileRaw[0];
    const file = fileRaw;
    if (!ticker || !file) {
      return NextResponse.json({ error: 'Missing ticker or file' }, { status: 400 });
    }
    if (!['image/png', 'image/jpeg'].includes(file.mimetype || '')) {
      return NextResponse.json({ error: 'Only PNG/JPG allowed' }, { status: 400 });
    }
    // Ensure logo dir exists
    if (!fs.existsSync(LOGO_DIR)) fs.mkdirSync(LOGO_DIR, { recursive: true });
    const outPath = path.join(LOGO_DIR, `${ticker}.png`);
    // Resize/crop to 64x64px
    await sharp(file.filepath)
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
      if (t.ticker.toUpperCase() === ticker) {
        t.logoUrl = `/images/logos/${ticker}.png`;
        found = true;
      }
    }
    if (!found) {
      tickers.push({ ticker, logoUrl: `/images/logos/${ticker}.png` });
    }
    fs.writeFileSync(TICKERS_JSON, JSON.stringify(tickers, null, 2));
    return NextResponse.json({ success: true, logoUrl: `/images/logos/${ticker}.png` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
} 