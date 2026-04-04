import { NextRequest, NextResponse } from "next/server"
import tickers from "@/lib/tickers.json"

export async function GET(request: NextRequest) {
  return NextResponse.json({ tickers })
}
