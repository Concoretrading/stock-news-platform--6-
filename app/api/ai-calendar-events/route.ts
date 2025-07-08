/// <reference types="node" />
import { type NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/services/auth-service";
import { analyzeCalendarScreenshot } from "@/lib/services/calendar-service";

export const runtime = 'nodejs';

// Only the admin can upload/edit earnings calendar
const ADMIN_UID = 'YOUR_USER_ID'; // Replace this with your actual Firebase user ID

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await verifyAuthToken(idToken);
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // Check if user is admin
    if (userId !== ADMIN_UID) {
      return NextResponse.json({ error: "Not authorized to upload calendar events" }, { status: 403 });
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const imageType = file.type.split('/')[1]; // Get file extension from mime type

    // Analyze the screenshot
    const result = await analyzeCalendarScreenshot(userId, buffer, imageType);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing calendar screenshot:", error);
    return NextResponse.json(
      { error: "Failed to process calendar screenshot" },
      { status: 500 }
    );
  }
} 