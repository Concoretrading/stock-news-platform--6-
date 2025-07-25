import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/services/test-service';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No Authorization header' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);
    return new Response(JSON.stringify({ decoded }), { status: 200 });
  } catch (err: Error | unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 401 });
  }
} 