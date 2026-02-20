import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

// Approximate pricing per 1M tokens (USD) — Anthropic public pricing
const MODEL_PRICING: Record<string, { input: number; output: number; tier: string }> = {
  "anthropic/claude-opus-4-6": { input: 15, output: 75, tier: "Frontier" },
  "anthropic/claude-opus-4-20250514": { input: 15, output: 75, tier: "Frontier" },
  "anthropic/claude-sonnet-4-20250514": { input: 3, output: 15, tier: "Standard" },
  "anthropic/claude-sonnet-4-0-20250514": { input: 3, output: 15, tier: "Standard" },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25, tier: "Fast" },
  "anthropic/claude-3-haiku-20240307": { input: 0.25, output: 1.25, tier: "Fast" },
  "anthropic/claude-haiku-3-5-20241022": { input: 0.8, output: 4, tier: "Fast" },
};

function getModelShortName(model: string): string {
  if (model.includes("opus-4-6") || model.includes("opus-4-2")) return "Opus 4";
  if (model.includes("sonnet-4")) return "Sonnet 4";
  if (model.includes("haiku-3-5")) return "Haiku 3.5";
  if (model.includes("haiku-3")) return "Haiku 3";
  return model.split("/").pop() || model;
}

export async function GET() {
  try {
    // Read config for agent list + defaults
    const configRaw = await readFile("/Users/sekaichi/.openclaw/openclaw.json", "utf-8");
    const config = JSON.parse(configRaw);

    const defaultModel = config.agents?.defaults?.model?.primary || "unknown";
    const agentsList = config.agents?.list || [];

    // Get live session data
    let sessions: Array<Record<string, unknown>> = [];
    try {
      const { stdout } = await execAsync("openclaw status --json", {
        timeout: 10000,
        env: { ...process.env, PATH: `${process.env.PATH}:/opt/homebrew/bin:/usr/local/bin` },
      });
      const data = JSON.parse(stdout.trim());
      sessions = data.sessions?.recent || [];
    } catch {
      // continue without session data
    }

    // Find the default agent
    const defaultAgent = agentsList.find((a: Record<string, unknown>) => a.default === true);
    
    // Build agent info
    const agents = [
      // Main agent (either from config or fallback)
      defaultAgent ? {
        id: defaultAgent.id,
        name: (defaultAgent.identity as Record<string, string>)?.name || defaultAgent.name || "Jennie",
        emoji: (defaultAgent.identity as Record<string, string>)?.emoji || "🐾",
        role: "AI Teammate (Main)",
        model: (defaultAgent.model as Record<string, string>)?.primary || defaultModel,
        modelShort: getModelShortName((defaultAgent.model as Record<string, string>)?.primary || defaultModel),
        pricing: MODEL_PRICING[(defaultAgent.model as Record<string, string>)?.primary || defaultModel] || null,
        status: "active",
        type: "primary",
      } : {
        id: "main",
        name: "Jennie",
        emoji: "🐾",
        role: "AI Teammate (Main)",
        model: defaultModel,
        modelShort: getModelShortName(defaultModel),
        pricing: MODEL_PRICING[defaultModel] || null,
        status: "active",
        type: "primary",
      },
      // Other agents (exclude the default one to avoid duplicates)
      ...agentsList.filter((a: Record<string, unknown>) => a.default !== true).map((a: Record<string, unknown>) => {
        const model = (a.model as Record<string, string>)?.primary || defaultModel;
        const identity = a.identity as Record<string, string> | undefined;
        return {
          id: a.id,
          name: identity?.name || a.name || a.id,
          emoji: identity?.emoji || "🤖",
          role: a.id === "lisa" ? "Villa Concierge" : "Agent",
          model,
          modelShort: getModelShortName(model),
          pricing: MODEL_PRICING[model] || null,
          status: "active",
          type: "agent",
        };
      }),
      {
        id: "rose",
        name: "Rosé",
        emoji: "🌹",
        role: "Coding Agent (Sub-agent)",
        model: "Claude Code CLI",
        modelShort: "Sonnet 4 (CLI)",
        pricing: MODEL_PRICING["anthropic/claude-sonnet-4-20250514"] || null,
        status: sessions.some((s: Record<string, unknown>) =>
          typeof s.key === "string" && s.key.startsWith("agent:main:sub:") &&
          typeof s.age === "number" && s.age < 300000
        ) ? "active" : "idle",
        type: "subagent",
      },
    ];

    // Cost comparison vs all-Opus baseline
    const opusPricing = MODEL_PRICING["anthropic/claude-opus-4-6"];
    const monthlyEstimate = agents.reduce((sum, a) => {
      if (!a.pricing) return sum;
      // Rough estimate: main ~2M tokens/day, concierge ~500k/day, coding ~1M/day
      const dailyTokensK = a.id === "main" ? 2000 : a.id === "lisa" ? 500 : 1000;
      const dailyCost = (dailyTokensK / 1000) * (a.pricing.input * 0.3 + a.pricing.output * 0.7);
      return sum + dailyCost * 30;
    }, 0);

    const opusBaseline = (() => {
      const dailyTokensK = 2000 + 500 + 1000;
      const dailyCost = (dailyTokensK / 1000) * (opusPricing.input * 0.3 + opusPricing.output * 0.7);
      return dailyCost * 30;
    })();

    return NextResponse.json({
      agents,
      costSummary: {
        estimatedMonthly: Math.round(monthlyEstimate * 100) / 100,
        opusBaseline: Math.round(opusBaseline * 100) / 100,
        savingsPercent: Math.round((1 - monthlyEstimate / opusBaseline) * 100),
      },
    });
  } catch (err) {
    return NextResponse.json({ agents: [], costSummary: null }, { status: 500 });
  }
}
