import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hours = parseInt(searchParams.get("hours") || "24", 10);
  
  // Fast mock activity data
  const now = new Date();
  const activities = [
    {
      id: "act-001",
      timestamp: new Date(now.getTime() - 2 * 60000).toISOString(),
      type: "session",
      description: "Jennie - Mission Control Dashboard Improvements",
      status: "success",
    },
    {
      id: "act-002",
      timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
      type: "cron",
      description: "Villa Concierge - Message Monitor",
      status: "success",
    },
    {
      id: "act-003",
      timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
      type: "agent",
      description: "Lisa - Guest WiFi Password Request",
      status: "success",
    },
    {
      id: "act-004",
      timestamp: new Date(now.getTime() - 1.5 * 3600000).toISOString(),
      type: "deployment",
      description: "Vercel - Mission Control Updated",
      status: "success",
    },
    {
      id: "act-005",
      timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
      type: "backup",
      description: "GitHub - Code Repository Push",
      status: "success",
    },
  ];

  return NextResponse.json(activities);
}