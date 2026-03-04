import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

interface SmartNotification {
  id: string;
  type: "alert" | "success" | "info" | "warning";
  priority: "low" | "medium" | "high" | "critical";
  category: "agents" | "system";
  title: string;
  message: string;
  timestamp: number;
  source: string;
  actionable: boolean;
  action?: { label: string; url?: string };
  read?: boolean;
}

const OPENCLAW_HOME = "/Users/sekaichi/.openclaw";

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

async function getNotifications(): Promise<SmartNotification[]> {
  const now = Date.now();
  const notifications: SmartNotification[] = [];

  // ── 1. Cron job health ─────────────────────────────────────────────────────
  type Job = {
    id: string; name: string; enabled: boolean; agentId?: string; sessionKey?: string;
    state?: { lastStatus?: string; lastRunAtMs?: number; nextRunAtMs?: number; consecutiveErrors?: number };
  };

  const jobsData = await readJson<{ jobs: Job[] }>(join(OPENCLAW_HOME, "cron", "jobs.json"));
  const jobs: Job[] = jobsData?.jobs ?? [];

  for (const job of jobs) {
    if (!job.enabled) continue;
    const errors = job.state?.consecutiveErrors ?? 0;
    const lastRunMs = job.state?.lastRunAtMs ?? 0;
    const nextRunMs = job.state?.nextRunAtMs ?? 0;

    // Consecutive failures
    if (errors >= 1) {
      notifications.push({
        id: `job_fail_${job.id}`,
        type: errors >= 3 ? "alert" : "warning",
        priority: errors >= 3 ? "critical" : "high",
        category: "agents",
        title: `${job.name} failing`,
        message: errors === 1
          ? `Last run failed. Will retry on next schedule.`
          : `Failed ${errors} times in a row — needs attention.`,
        timestamp: lastRunMs || now,
        source: job.name,
        actionable: true,
        action: { label: "View Logs", url: "/tasks" },
        read: false,
      });
    }

    // Overdue — past next run time by more than 30 min and still not run
    if (nextRunMs > 0 && nextRunMs < now - 30 * 60 * 1000 && lastRunMs < nextRunMs) {
      notifications.push({
        id: `job_overdue_${job.id}`,
        type: "warning",
        priority: "high",
        category: "agents",
        title: `${job.name} overdue`,
        message: `Scheduled run has not started — may be stuck or skipped.`,
        timestamp: nextRunMs,
        source: job.name,
        actionable: true,
        action: { label: "Check Tasks", url: "/tasks" },
        read: false,
      });
    }
  }

  // ── 2. Gateway status ──────────────────────────────────────────────────────
  const gwStatus = await readJson<{ running?: boolean; pid?: number; startedAt?: number }>(
    join(OPENCLAW_HOME, "gateway.json")
  );
  if (gwStatus && gwStatus.running === false) {
    notifications.push({
      id: "gateway_down",
      type: "alert",
      priority: "critical",
      category: "system",
      title: "Gateway offline",
      message: "The OpenClaw gateway is not running. Agents cannot receive or send messages.",
      timestamp: now,
      source: "Gateway",
      actionable: true,
      action: { label: "Restart", url: "/settings" },
      read: false,
    });
  }

  // ── 3. All jobs healthy ────────────────────────────────────────────────────
  const enabledJobs = jobs.filter((j) => j.enabled);
  const allOk = enabledJobs.length > 0 &&
    enabledJobs.every((j) => (j.state?.consecutiveErrors ?? 0) === 0 && j.state?.lastStatus !== "error");

  if (allOk && notifications.length === 0) {
    const lastRun = Math.max(...enabledJobs.map((j) => j.state?.lastRunAtMs ?? 0));
    notifications.push({
      id: "all_agents_healthy",
      type: "success",
      priority: "low",
      category: "agents",
      title: "All agents healthy",
      message: `${enabledJobs.length} scheduled job${enabledJobs.length !== 1 ? "s" : ""} running without errors.`,
      timestamp: lastRun || now,
      source: "Agent Network",
      actionable: false,
      read: true,
    });
  }

  return notifications.sort((a, b) => {
    // Critical/high first, then by timestamp
    const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const pd = pOrder[a.priority] - pOrder[b.priority];
    return pd !== 0 ? pd : b.timestamp - a.timestamp;
  });
}

export async function GET() {
  const notifications = await getNotifications();
  // Build categories summary for the UI filter bar
  const categoryMap = new Map<string, { count: number; urgent: number }>();
  for (const n of notifications) {
    const c = categoryMap.get(n.category) ?? { count: 0, urgent: 0 };
    c.count++;
    if (n.priority === "high" || n.priority === "critical") c.urgent++;
    categoryMap.set(n.category, c);
  }
  const categories = Array.from(categoryMap.entries()).map(([category, data]) => ({ category, ...data }));

  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    criticalCount: notifications.filter((n) => n.priority === "critical").length,
    categories,
  });
}
