import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fast mock data for development - replace with real OpenClaw integration later
    return NextResponse.json({
      agent: "Jennie",
      status: "active",
      model: "anthropic/claude-sonnet-4-20250514",
      lastActivity: new Date().toISOString(),
      host: "SEKAICHIs-Mac-mini.local",
      platform: "macos 26.3 (arm64)",
      version: "2026.2.19",
      activeSessions: 3,
      contextUsed: 69,
      totalTokens: 137693,
      contextTokens: 200000,
      roseActive: false,
    });
  } catch (err) {
    return NextResponse.json({
      agent: "Jennie",
      status: "standby",
      model: "unknown",
      lastActivity: null,
      host: null,
      platform: null,
      version: null,
      activeSessions: 0,
      contextUsed: 0,
      totalTokens: 0,
      contextTokens: 200000,
    });
  }
}