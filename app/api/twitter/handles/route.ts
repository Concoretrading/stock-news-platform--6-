import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function GET() {
  try {
    const { data, error } = await supabase.from("twitter_handles").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data,
    })
  } catch (error) {
    console.error("Error fetching Twitter handles:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch handles" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { handle, displayName } = await request.json()

    // Clean up handle format
    const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`

    // In a real implementation, you would validate the Twitter handle exists
    const { data, error } = await supabase
      .from("twitter_handles")
      .insert({
        handle: cleanHandle,
        display_name: displayName || cleanHandle.replace("@", ""),
        follower_count: 0, // Would be fetched from Twitter API
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Twitter handle added successfully",
      data: data,
    })
  } catch (error) {
    console.error("Error adding Twitter handle:", error)
    return NextResponse.json({ success: false, error: "Failed to add handle" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const handleId = searchParams.get("id")

    if (!handleId) {
      return NextResponse.json({ success: false, error: "Handle ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("twitter_handles").delete().eq("id", handleId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Twitter handle removed successfully",
    })
  } catch (error) {
    console.error("Error removing Twitter handle:", error)
    return NextResponse.json({ success: false, error: "Failed to remove handle" }, { status: 500 })
  }
}
