import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Get today's date in JST
    const today = new Date();
    const jstToday = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const dateStr = jstToday.toISOString().split('T')[0];

    // Simulate calendar check - would use actual Google Calendar API in production
    const events = [
      {
        title: "Team Standup",
        time: "10:00",
        duration: "30min"
      },
      {
        title: "Japan Villas Review",
        time: "14:00", 
        duration: "1h"
      }
    ];

    const message = events.length > 0 
      ? `Today (${dateStr}): ${events.length} events - ${events.map(e => `${e.time} ${e.title}`).join(', ')}`
      : `No events scheduled for today (${dateStr})`;

    return NextResponse.json({
      message,
      success: true,
      data: { date: dateStr, events }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Failed to fetch calendar data", 
        message: "Calendar check failed" 
      }, 
      { status: 500 }
    );
  }
}