import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, readdir, stat } from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

const OPENCLAW_HOME = process.env.OPENCLAW_HOME || path.join(process.env.HOME || "", ".openclaw");

interface ActivityEntry {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  status: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hours = parseInt(searchParams.get("hours") || "24", 10);
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const entries: ActivityEntry[] = [];

  // 1. Parse gateway logs for meaningful events
  try {
    const { stdout } = await execAsync(
      "openclaw logs --json --limit 200",
      {
        timeout: 15000,
        env: { ...process.env, PATH: `${process.env.PATH}:/opt/homebrew/bin:/usr/local/bin` },
      }
    );

    const lines = stdout.trim().split("\n");
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type !== "log") continue;

        const ts = new Date(entry.time);
        if (ts.getTime() < cutoff) continue;

        const msg = entry.message || "";
        const level = entry.level || "info";
        const subsystem = entry.subsystem || "";

        // Filter for interesting events
        let type = "";
        let description = "";
        let status = "info";

        if (msg.includes("embedded run start:")) {
          const runId = msg.match(/runId=([a-f0-9-]+)/)?.[1]?.slice(0, 8) || "";
          const channel = msg.match(/messageChannel=(\w+)/)?.[1] || "";
          const model = msg.match(/model=([^\s]+)/)?.[1] || "";
          type = "agent-run";
          description = `Agent run started${channel ? ` (${channel})` : ""}${model ? ` on ${model}` : ""}`;
          status = "running";
        } else if (msg.includes("embedded run done:")) {
          const durationMs = msg.match(/durationMs=(\d+)/)?.[1];
          const duration = durationMs ? `${(parseInt(durationMs) / 1000).toFixed(1)}s` : "";
          const aborted = msg.includes("aborted=true");
          type = "agent-run";
          description = `Agent run completed${duration ? ` in ${duration}` : ""}`;
          status = aborted ? "error" : "ok";
        } else if (msg.includes("embedded run tool start:")) {
          const tool = msg.match(/tool=(\w+)/)?.[1] || "unknown";
          type = "tool-call";
          description = `Tool call: ${tool}`;
          status = "running";
        } else if (msg.includes("config change detected") || msg.includes("config hot reload")) {
          type = "config";
          description = msg.includes("hot reload") ? "Config hot-reloaded" : "Config change detected";
          status = "ok";
        } else if (msg.includes("slack socket mode connected")) {
          type = "channel";
          description = "Slack connected";
          status = "ok";
        } else if (msg.includes("starting provider")) {
          const channel = subsystem.includes("slack") ? "Slack" : subsystem.includes("telegram") ? "Telegram" : "channel";
          type = "channel";
          description = `${channel} provider starting`;
          status = "info";
        } else if (msg.includes("slack channels resolved")) {
          type = "channel";
          description = "Slack channels resolved";
          status = "ok";
        } else if (level === "error" && !msg.includes("Gateway failed to start") && !msg.includes("Port 18789") && !msg.includes("Gateway service appears") && !msg.includes("Tip:") && !msg.includes("Or:")) {
          type = "error";
          description = msg.length > 120 ? msg.slice(0, 120) + "…" : msg;
          status = "error";
        } else if (msg.includes("lane enqueue:")) {
          const lane = msg.match(/lane=([^\s]+)/)?.[1] || "";
          if (lane.includes("slack") || lane.includes("main") || lane.includes("telegram")) {
            type = "queue";
            const friendly = lane.replace("session:agent:main:", "").replace(/:thread:.+/, " (thread)");
            description = `Message queued: ${friendly}`;
            status = "info";
          } else {
            continue;
          }
        } else {
          continue;
        }

        entries.push({
          id: `log-${ts.getTime()}-${entries.length}`,
          timestamp: ts.toISOString(),
          type,
          description,
          status,
        });
      } catch {
        continue;
      }
    }
  } catch {
    // Log parsing failed, continue with other sources
  }

  // 2. Add session activity from openclaw status
  try {
    const { stdout } = await execAsync("openclaw status --json", {
      timeout: 10000,
      env: { ...process.env, PATH: `${process.env.PATH}:/opt/homebrew/bin:/usr/local/bin` },
    });
    const data = JSON.parse(stdout.trim());
    const sessions = data.sessions?.recent || [];

    for (const session of sessions) {
      const updatedAt = session.updatedAt;
      if (!updatedAt || updatedAt < cutoff) continue;

      const key = (session.key || "").replace("agent:main:", "");
      let friendlyName = key;
      if (key === "main") friendlyName = "Main session (webchat)";
      else if (key.includes("slack:channel")) friendlyName = `Slack channel session`;
      else if (key.includes("slack") && key.includes("thread")) friendlyName = "Slack thread session";
      else if (key.includes("telegram")) friendlyName = "Telegram session";
      else if (key.includes("cron")) friendlyName = "Cron job session";

      entries.push({
        id: `session-${session.sessionId}`,
        timestamp: new Date(updatedAt).toISOString(),
        type: "session",
        description: `${friendlyName} — ${session.percentUsed}% context, ${session.outputTokens} tokens out`,
        status: "ok",
      });
    }
  } catch {
    // ignore
  }

  // 3. Add cron job runs
  try {
    const jobsPath = path.join(OPENCLAW_HOME, "cron", "jobs.json");
    const raw = await readFile(jobsPath, "utf-8");
    const data = JSON.parse(raw);
    const jobs = Array.isArray(data) ? data : Array.isArray(data.jobs) ? data.jobs : [];

    for (const job of jobs) {
      const lastRun = job.state?.lastRunAtMs;
      if (!lastRun || lastRun < cutoff) continue;

      entries.push({
        id: `cron-${job.id}`,
        timestamp: new Date(lastRun).toISOString(),
        type: "cron",
        description: `Cron: ${job.name || "Unnamed"} — ${job.state?.lastDurationMs ? (job.state.lastDurationMs / 1000).toFixed(1) + "s" : "completed"}`,
        status: job.state?.lastStatus || "ok",
      });
    }
  } catch {
    // ignore
  }

  // Sort by timestamp descending
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Deduplicate by removing consecutive similar entries
  const deduped: ActivityEntry[] = [];
  for (const entry of entries) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.description === entry.description && prev.type === entry.type) continue;
    deduped.push(entry);
  }

  return NextResponse.json(deduped.slice(0, 100));
}
