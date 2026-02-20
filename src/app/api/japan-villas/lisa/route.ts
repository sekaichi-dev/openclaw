import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "online",
    activeSessions: 2,
    lastActivity: new Date().toISOString(),
    autoRespond: true,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;
  if (action === "send") {
    // Will wire to real Slack/Lisa integration later
    return NextResponse.json({ ok: true, sent: true });
  }
  return NextResponse.json({ ok: true });
}
