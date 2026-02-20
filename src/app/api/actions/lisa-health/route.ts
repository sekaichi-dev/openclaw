import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { OPENCLAW_HOME } from "@/lib/constants";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Check Lisa's concierge state file
    const statePath = path.join(process.env.HOME || "", ".openclaw/workspace/japan-villas/concierge-state.json");
    let lastChecked = "Unknown";
    let messageCount = 0;

    try {
      const stateData = await readFile(statePath, "utf-8");
      const state = JSON.parse(stateData);
      lastChecked = state.lastCheckedAt ? new Date(state.lastCheckedAt).toLocaleTimeString() : "Unknown";
      messageCount = state.lastCheckedMessageId || 0;
    } catch {
      // State file doesn't exist or is corrupted
    }

    // Check cron job status
    const cronPath = path.join(OPENCLAW_HOME, "cron", "jobs.json");
    let cronStatus = "Unknown";
    try {
      const cronData = await readFile(cronPath, "utf-8");
      const jobs = JSON.parse(cronData);
      const lisaJob = jobs.find((job: any) => job.name?.includes("Villa Concierge"));
      if (lisaJob) {
        cronStatus = lisaJob.state?.lastStatus === "ok" ? "Healthy" : "Issues detected";
      }
    } catch {
      // Cron file issues
    }

    const message = `Lisa: ${cronStatus} • Last check: ${lastChecked} • Monitoring active`;

    return NextResponse.json({
      message,
      success: true,
      data: { 
        cronStatus, 
        lastChecked, 
        messageCount,
        monitoring: cronStatus === "Healthy"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Failed to check Lisa health", 
        message: "Lisa health check failed" 
      }, 
      { status: 500 }
    );
  }
}