import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // In production, this would trigger the actual morning brief cron job
    // For now, simulate the action
    
    const currentTime = new Date().toLocaleTimeString("en-US", { 
      timeZone: "Asia/Tokyo",
      hour12: false 
    });

    const message = `Morning brief triggered at ${currentTime} JST • Will be delivered to #001-ai-agent-hq`;

    return NextResponse.json({
      message,
      success: true,
      data: { 
        triggerTime: currentTime,
        target: "#001-ai-agent-hq",
        status: "queued"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Failed to trigger morning brief", 
        message: "Morning brief trigger failed" 
      }, 
      { status: 500 }
    );
  }
}