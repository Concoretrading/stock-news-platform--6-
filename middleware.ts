import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: '/api/upcoming-events'
}

export function middleware(request: NextRequest) {
  // Force Node.js runtime for this route
  const response = NextResponse.next()
  response.headers.set('x-middleware-next', '1')
  return response
} 