import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Simulate email check - would use actual Gmail API in production
    const currentHour = new Date().getHours();
    const unreadCount = Math.floor(Math.random() * 5) + (currentHour > 9 && currentHour < 18 ? 2 : 0);
    
    const priorityEmails = [
      "Japan Villas booking inquiry",
      "Partner meeting request", 
      "OpenClaw update notification"
    ];

    const hasHighPriority = unreadCount > 3;
    const message = hasHighPriority 
      ? `${unreadCount} unread emails • 1 high priority`
      : unreadCount > 0
      ? `${unreadCount} unread emails • No urgent items`
      : "Inbox clear • 0 unread emails";

    return NextResponse.json({
      message,
      success: true,
      data: { 
        unreadCount, 
        hasHighPriority,
        lastChecked: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Failed to check inbox", 
        message: "Email check failed" 
      }, 
      { status: 500 }
    );
  }
}