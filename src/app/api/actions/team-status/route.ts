import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { OPENCLAW_HOME } from "@/lib/constants";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Check all agent statuses by reading various status files
    let jennieStatus = "Unknown";
    let lisaStatus = "Unknown";
    let roseStatus = "Available";

    // Check main agent status
    try {
      const statusPath = path.join(OPENCLAW_HOME, "status.json");
      const statusData = await readFile(statusPath, "utf-8");
      const status = JSON.parse(statusData);
      jennieStatus = status.status === "active" ? "Active" : "Idle";
    } catch {
      jennieStatus = "Offline";
    }

    // Check Lisa via cron job health
    try {
      const cronPath = path.join(OPENCLAW_HOME, "cron", "jobs.json");
      const cronData = await readFile(cronPath, "utf-8");
      const jobs = JSON.parse(cronData);
      const lisaJob = jobs.find((job: any) => job.name?.includes("Villa Concierge"));
      lisaStatus = lisaJob?.state?.lastStatus === "ok" ? "Monitoring" : "Issues";
    } catch {
      lisaStatus = "Unknown";
    }

    // Rosé is always available (spawned on demand)
    // Could check for active sub-agent sessions here in the future

    const message = `Jennie: ${jennieStatus} • Lisa: ${lisaStatus} • Rosé: ${roseStatus}`;

    return NextResponse.json({
      message,
      success: true,
      data: { 
        jennie: jennieStatus,
        lisa: lisaStatus,
        rose: roseStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Failed to check team status", 
        message: "Team status check failed" 
      }, 
      { status: 500 }
    );
  }
}