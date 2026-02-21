import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { stdout } = await execAsync("openclaw status --json", {
      timeout: 10000,
      env: { ...process.env, PATH: `${process.env.PATH}:/opt/homebrew/bin:/usr/local/bin` },
    });
    const data = JSON.parse(stdout.trim());

    // Determine active vs standby from sessions
    const sessions = data.sessions?.recent || [];
    const now = Date.now();
    // If any session was updated in the last 30 seconds, agent is active
    const isActive = sessions.some(
      (s: { updatedAt?: number; age?: number }) => (s.age != null ? s.age < 30000 : false)
    );

    // Get main session for last activity
    const mainSession = sessions.find(
      (s: { key?: string }) => s.key === "agent:main:main"
    );
    const mostRecent = sessions[0]; // Already sorted by recency

    // Model info
    const model = data.sessions?.defaults?.model || "unknown";

    // Gateway uptime
    const gatewayInfo = data.gateway?.self || {};

    // Last activity from most recent session
    const lastActivityMs = mostRecent?.updatedAt;
    const lastActivity = lastActivityMs
      ? new Date(lastActivityMs).toISOString()
      : null;

    // Context usage from main session
    const contextUsed = mainSession?.percentUsed || 0;
    const totalTokens = mainSession?.totalTokens || 0;
    const contextTokens = mainSession?.contextTokens || 200000;

    // Check for active sub-agent (coding) sessions → Rosé visibility
    const subagentSessions = sessions.filter(
      (s: { key?: string; age?: number }) =>
        s.key && s.key.startsWith("agent:main:sub:") && s.age != null && s.age < 300000
    );
    const roseActive = subagentSessions.length > 0;

    return NextResponse.json({
      agent: "Jennie",
      status: isActive ? "active" : "standby",
      model,
      lastActivity,
      host: gatewayInfo.host || null,
      platform: gatewayInfo.platform || data.os?.label || null,
      version: gatewayInfo.version || null,
      activeSessions: sessions.length,
      contextUsed,
      totalTokens,
      contextTokens,
      roseActive,
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
