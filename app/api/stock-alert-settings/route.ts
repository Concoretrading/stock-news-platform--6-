import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get("ticker")

  if (!ticker) {
    return NextResponse.json({ success: false, error: "Ticker is required" }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from("stock_alert_settings")
      .select("*")
      .eq("ticker", ticker.toUpperCase())
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    // Return default settings if none exist
    const settings = data || {
      ticker: ticker.toUpperCase(),
      default_tolerance_points: 2.0,
      default_minimum_movement: 10.0,
      auto_create_alerts: true,
      notification_preferences: { email: false, push: true, sms: false },
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error("Error fetching stock alert settings:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { ticker, defaultTolerancePoints, defaultMinimumMovement, autoCreateAlerts, notificationPreferences } = data

    const { data: result, error } = await supabase
      .from("stock_alert_settings")
      .upsert(
        {
          ticker: ticker.toUpperCase(),
          default_tolerance_points: defaultTolerancePoints,
          default_minimum_movement: defaultMinimumMovement,
          auto_create_alerts: autoCreateAlerts,
          notification_preferences: notificationPreferences,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "ticker" },
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Stock alert settings saved successfully",
      data: result,
    })
  } catch (error) {
    console.error("Error saving stock alert settings:", error)
    return NextResponse.json({ success: false, error: "Failed to save settings" }, { status: 500 })
  }
}
