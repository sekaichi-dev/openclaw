import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { OPENCLAW_HOME } from "@/lib/constants";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jobsPath = path.join(OPENCLAW_HOME, "cron", "jobs.json");
    const raw = await readFile(jobsPath, "utf-8");
    const data = JSON.parse(raw);
    const jobs = Array.isArray(data) ? data : Array.isArray(data.jobs) ? data.jobs : [];
    return NextResponse.json(jobs);
  } catch {
    return NextResponse.json([]);
  }
}
