import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Fast mock data for development
export async function GET() {
  try {
    const agents = [
      {
        id: "jennie",
        name: "Jennie",
        emoji: "🐾",
        role: "AI Teammate (Main)",
        model: "anthropic/claude-sonnet-4-20250514",
        modelShort: "Sonnet 4",
        pricing: { input: 3, output: 15, tier: "Standard" },
        status: "active",
        type: "primary",
        contextUsed: 69,
        totalTokens: 137693,
        dailyCost: 10.5,
        lastActivity: new Date(Date.now() - 2 * 60000).toISOString(),
      },
      {
        id: "lisa",
        name: "Lisa",
        emoji: "💜",
        role: "Villa Concierge",
        model: "anthropic/claude-haiku-3-5-20241022",
        modelShort: "Haiku 3.5",
        pricing: { input: 0.8, output: 4, tier: "Fast" },
        status: "active",
        type: "agent",
        contextUsed: 5,
        totalTokens: 9573,
        dailyCost: 1.6,
        lastActivity: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: "rose",
        name: "Rosé",
        emoji: "⚡",
        role: "Coding Agent",
        model: "anthropic/claude-sonnet-4-20250514",
        modelShort: "Sonnet 4",
        pricing: { input: 3, output: 15, tier: "Standard" },
        status: "standby",
        type: "subagent",
        contextUsed: 0,
        totalTokens: 0,
        dailyCost: 0,
        lastActivity: null,
      },
    ];

    return NextResponse.json({
      agents,
      costSummary: {
        estimatedMonthly: 360,
        opusBaseline: 3150,
        savingsPercent: 89,
      },
    });
  } catch (err) {
    return NextResponse.json({ agents: [], costSummary: null });
  }
}