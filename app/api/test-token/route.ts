import { NextRequest } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No Authorization header' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = await getAuth().verifyIdToken(token);
    return new Response(JSON.stringify({ decoded }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 401 });
  }
} 