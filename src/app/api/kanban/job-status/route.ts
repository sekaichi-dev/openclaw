import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { OPENCLAW_HOME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  // 1. Check run log for status
  let running = false;
  let finished = false;
  let lastStatus: string | null = null;
  let sessionId: string | null = null;

  try {
    const runLog = await readFile(
      path.join(OPENCLAW_HOME, "cron", "runs", `${jobId}.jsonl`), "utf-8"
    );
    const lines = runLog.trim().split("\n").filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

    const startEntry = lines.find((l: any) => l.action === "started");
    const finishEntry = lines.find((l: any) => l.action === "finished");

    if (finishEntry) {
      finished = true;
      // Treat delivery-only errors as success (work was done)
      lastStatus = finishEntry.error?.includes("Channel is required") ? "ok" : (finishEntry.status ?? "ok");
      sessionId = finishEntry.sessionId ?? null;
    } else if (startEntry) {
      running = true;
      sessionId = startEntry.sessionId ?? null;
    }
  } catch {
    // No run log yet — job is queued
    running = true;
  }

  // If still no sessionId, check sessions.json
  if (!sessionId) {
    try {
      const sessionsRaw = await readFile(
        path.join(OPENCLAW_HOME, "agents", "jennie", "sessions", "sessions.json"), "utf-8"
      );
      const map = JSON.parse(sessionsRaw);
      const entry = map[`agent:jennie:cron:${jobId}`];
      sessionId = entry?.sessionId ?? null;
    } catch {}
  }

  // 2. Read session messages
  const messages: { role: string; content: string }[] = [];

  if (sessionId) {
    try {
      const sessionFile = path.join(
        OPENCLAW_HOME, "agents", "jennie", "sessions", `${sessionId}.jsonl`
      );
      const raw = await readFile(sessionFile, "utf-8");
      const entries = raw.trim().split("\n").filter(Boolean)
        .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

      for (const entry of entries) {
        if (entry.type !== "message") continue;
        const msg = entry.message;
        if (!msg) continue;

        if (msg.role === "assistant") {
          const parts = Array.isArray(msg.content) ? msg.content : [];
          // Collect text output
          const text = parts
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text?.trim())
            .filter(Boolean)
            .join("\n");
          if (text) messages.push({ role: "assistant", content: text });

          // Collect tool calls
          for (const c of parts) {
            if (c.type === "tool_use") {
              const input = c.input ?? {};
              const detail = c.name === "exec"
                ? (input.command ?? "").slice(0, 80)
                : c.name === "Read" || c.name === "Write" || c.name === "Edit"
                ? (input.file_path ?? input.path ?? "").replace("/Users/sekaichi", "~")
                : "";
              messages.push({ role: "tool", content: `${c.name}${detail ? `: ${detail}` : ""}` });
            }
          }
        }
      }
    } catch {}
  }

  return NextResponse.json({ running, finished, lastStatus, sessionId, messages });
}
