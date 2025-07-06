import { NextResponse } from "next/server"

export async function GET() {
  // console.log("=== TEST ENV ENDPOINT CALLED ===");
  
  const envCheck = {
    GOOGLE_APPLICATION_CREDENTIALS_JSON: {
      exists: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      length: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.length || 0,
      firstChars: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.substring(0, 50) || 'N/A',
      lastChars: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.substring(-50) || 'N/A'
    },
    GOOGLE_CLOUD_FUNCTION_URL: {
      exists: !!process.env.GOOGLE_CLOUD_FUNCTION_URL,
      value: process.env.GOOGLE_CLOUD_FUNCTION_URL || 'N/A'
    }
  };
  
  // console.log("Environment check:", JSON.stringify(envCheck, null, 2));
  
  return NextResponse.json({
    message: "Environment variables check",
    data: envCheck
  });
} 