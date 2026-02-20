import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { OPENCLAW_HOME } from "@/lib/constants";
import path from "path";

export const dynamic = "force-dynamic";

interface ActionItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  priority: "high" | "medium" | "low";
}

export async function GET() {
  const actions: ActionItem[] = [];

  // Check for pairing requests
  try {
    const pairingPath = path.join(OPENCLAW_HOME, "pairing-requests.json");
    const raw = await readFile(pairingPath, "utf-8");
    const requests = JSON.parse(raw);
    if (Array.isArray(requests)) {
      for (const req of requests) {
        actions.push({
          id: req.id || `pairing-${Date.now()}`,
          type: "pairing_request",
          description: req.description || "Pairing session requested",
          timestamp: req.timestamp || new Date().toISOString(),
          priority: "high",
        });
      }
    }
  } catch {
    // No pairing requests file
  }

  // Check for failed cron jobs
  try {
    const cronPath = path.join(OPENCLAW_HOME, "cron", "jobs.json");
    const raw = await readFile(cronPath, "utf-8");
    const jobs = JSON.parse(raw);
    if (Array.isArray(jobs)) {
      for (const job of jobs) {
        if (job.lastStatus === "error" || job.lastStatus === "failed") {
          actions.push({
            id: `cron-${job.name || job.id}`,
            type: "failed_cron",
            description: `Cron job "${job.name}" failed`,
            timestamp: job.lastRun || new Date().toISOString(),
            priority: "medium",
          });
        }
      }
    }
  } catch {
    // No cron jobs file
  }

  // Check for pending approvals
  try {
    const approvalsPath = path.join(OPENCLAW_HOME, "pending-approvals.json");
    const raw = await readFile(approvalsPath, "utf-8");
    const approvals = JSON.parse(raw);
    if (Array.isArray(approvals)) {
      for (const approval of approvals) {
        actions.push({
          id: approval.id || `approval-${Date.now()}`,
          type: "pending_approval",
          description: approval.description || "Approval needed",
          timestamp: approval.timestamp || new Date().toISOString(),
          priority: approval.priority || "medium",
        });
      }
    }
  } catch {
    // No pending approvals file
  }

  // Sort by priority (high first) then by timestamp (newest first)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return NextResponse.json(actions);
}
