import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { OPENCLAW_HOME, OPENCLAW_WORKSPACE } from "@/lib/constants";

const exec = promisify(execFile);

export const dynamic = "force-dynamic";

// ── Types ────────────────────────────────────────────────────────────────────

export type TaskStatus = "backlog" | "inProgress" | "done";

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  source: "cron" | "manual";
  cronJobId?: string;
  lastStatus?: "ok" | "error";
  lastRunAt?: number;
  nextRunAt?: number;
  enabled?: boolean;
  isRecurring?: boolean;
  prompt?: string;        // cron job payload message
  // manual enrichment fields
  priority?: "low" | "medium" | "high" | "urgent";
  notes?: string;
  dueDate?: string;
  blockers?: string;
  progress?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MANUAL_TASKS_PATH = path.join(OPENCLAW_WORKSPACE, "kanban-manual.json");
const TZ_OFFSET_MS = 9 * 60 * 60 * 1000; // JST = UTC+9

function startOfDayJST(now = Date.now()): number {
  const jstMs = now + TZ_OFFSET_MS;
  const dayMs = Math.floor(jstMs / 86400000) * 86400000;
  return dayMs - TZ_OFFSET_MS;
}

function agentForJob(job: { agentId?: string; sessionKey?: string }): string {
  // Check both fields — sessionKey is more reliable (agentId can be "main")
  const combined = `${job.agentId ?? ""} ${job.sessionKey ?? ""}`.toLowerCase();
  if (combined.includes("lisa"))  return "Lisa";
  if (combined.includes("rose"))  return "Rosé";
  if (combined.includes("jisoo")) return "Jisoo";
  return "Jennie";
}

async function readManualTasks(): Promise<KanbanTask[]> {
  try {
    const raw = await readFile(MANUAL_TASKS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeManualTasks(tasks: KanbanTask[]): Promise<void> {
  await writeFile(MANUAL_TASKS_PATH, JSON.stringify(tasks, null, 2));
}

// Read the JSONL run file for a job and find today's runs
async function getTodayRuns(jobId: string, startOfToday: number): Promise<{
  hasRunToday: boolean;
  lastStatus: "ok" | "error" | null;
  lastRunAt: number | null;
}> {
  try {
    const filePath = path.join(OPENCLAW_HOME, "cron", "runs", `${jobId}.jsonl`);
    const raw = await readFile(filePath, "utf-8");
    const lines = raw.trim().split("\n").filter(Boolean);

    const todayRuns = lines
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter((e) => e && e.action === "finished" && e.runAtMs >= startOfToday)
      .sort((a, b) => b.runAtMs - a.runAtMs);

    if (todayRuns.length === 0) {
      return { hasRunToday: false, lastStatus: null, lastRunAt: null };
    }
    return {
      hasRunToday: true,
      lastStatus: todayRuns[0].status ?? "ok",
      lastRunAt: todayRuns[0].runAtMs,
    };
  } catch {
    return { hasRunToday: false, lastStatus: null, lastRunAt: null };
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Optional ?date=YYYY-MM-DD to view a past day (JST)
  const dateParam = req.nextUrl.searchParams.get("date");
  let now = Date.now();
  if (dateParam) {
    // Parse as JST midnight → UTC ms
    const [y, m, d] = dateParam.split("-").map(Number);
    const jstMidnight = Date.UTC(y, m - 1, d) - TZ_OFFSET_MS;
    now = jstMidnight + 43200000; // noon of that day in JST → safe pivot
  }
  const startOfToday = startOfDayJST(now);
  const endOfToday = startOfToday + 86400000;

  // Load cron jobs
  let cronJobs: any[] = [];
  try {
    const raw = await readFile(path.join(OPENCLAW_HOME, "cron", "jobs.json"), "utf-8");
    const data = JSON.parse(raw);
    cronJobs = Array.isArray(data) ? data : (data.jobs ?? []);
  } catch {}

  // Build cron tasks
  const cronTasks: KanbanTask[] = await Promise.all(
    cronJobs.filter((j) => j.enabled !== false).map(async (job) => {
      const isRecurring = job.schedule?.kind === "every" || !!job.schedule?.everyMs;
      const state = job.state ?? {};
      const lastRunAtMs: number | null = state.lastRunAtMs ?? null;
      const nextRunAtMs: number | null = state.nextRunAtMs ?? null;

      let status: TaskStatus;

      if (isRecurring) {
        // Continuous monitoring jobs are always In Progress
        status = "inProgress";
      } else {
        // Check if ran today
        const { hasRunToday, lastStatus, lastRunAt } = await getTodayRuns(job.id, startOfToday);

        if (hasRunToday) {
          status = "done";
        } else if (nextRunAtMs && nextRunAtMs >= now && nextRunAtMs < endOfToday) {
          // Scheduled later today
          status = "backlog";
        } else if (lastRunAtMs && lastRunAtMs >= startOfToday) {
          // Ran today (state-level check as fallback)
          status = "done";
        } else {
          // Not scheduled today or missed — show as backlog
          status = "backlog";
        }
      }

      const { lastStatus: ls } = await getTodayRuns(job.id, startOfToday);

      return {
        id: `cron-${job.id}`,
        title: job.name,
        description: isRecurring
          ? `Runs every ${Math.round((job.schedule.everyMs ?? 900000) / 60000)}min`
          : `Scheduled ${nextRunAtMs ? new Date(nextRunAtMs).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }) : "daily"}`,
        status,
        assignee: agentForJob(job),
        source: "cron" as const,
        cronJobId: job.id,
        lastStatus: (ls ?? state.lastStatus ?? null) as "ok" | "error" | null ?? undefined,
        lastRunAt: lastRunAtMs ?? undefined,
        nextRunAt: nextRunAtMs ?? undefined,
        isRecurring,
        enabled: job.enabled !== false,
        prompt: job.payload?.message ?? undefined,
      };
    })
  );

  // Load manual tasks
  const manualTasks = await readManualTasks();

  return NextResponse.json({ tasks: [...cronTasks, ...manualTasks] });
}

// ── POST — add manual task ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description = "", assignee = "Jennie" } = body;
  if (!title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });

  const tasks = await readManualTasks();
  const newTask: KanbanTask = {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim(),
    description,
    status: "backlog",
    assignee,
    source: "manual",
    createdAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  await writeManualTasks(tasks);
  return NextResponse.json(newTask);
}

// ── PATCH — update manual task or cron prompt ─────────────────────────────────

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, prompt, status, title, description, assignee, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Cron task: only the prompt field is editable
  if (String(id).startsWith("cron-")) {
    const cronJobId = String(id).replace(/^cron-/, "");
    if (prompt === undefined) return NextResponse.json({ error: "only prompt is editable for cron tasks" }, { status: 400 });

    const jobsPath = path.join(OPENCLAW_HOME, "cron", "jobs.json");
    const raw = await readFile(jobsPath, "utf-8");
    const data = JSON.parse(raw);
    const jobs: any[] = Array.isArray(data) ? data : (data.jobs ?? []);

    const jobIdx = jobs.findIndex((j: any) => j.id === cronJobId);
    if (jobIdx === -1) return NextResponse.json({ error: "cron job not found" }, { status: 404 });

    jobs[jobIdx].payload = { ...jobs[jobIdx].payload, message: prompt };

    const updated = Array.isArray(data) ? jobs : { ...data, jobs };
    await writeFile(jobsPath, JSON.stringify(updated, null, 2));

    return NextResponse.json({ id, prompt });
  }

  // Manual task: update any fields
  const tasks = await readManualTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });

  const prevStatus = tasks[idx].status;

  if (status !== undefined) tasks[idx].status = status;
  if (title !== undefined) tasks[idx].title = title;
  if (description !== undefined) tasks[idx].description = description;
  if (assignee !== undefined) tasks[idx].assignee = assignee;
  if (prompt !== undefined) tasks[idx].prompt = prompt;
  tasks[idx].updatedAt = new Date().toISOString();
  Object.assign(tasks[idx], rest);

  await writeManualTasks(tasks);

  // Trigger Jennie to triage + delegate when task moves to In Progress
  if (status === "inProgress" && prevStatus !== "inProgress") {
    const task = tasks[idx];
    const taskPrompt = task.description || task.title;
    const jennieMessage = `TRIAGE TASK: "${task.title}"

A task just moved to In Progress. Your job is to TRIAGE and DELEGATE — not do the work yourself.

## Step 1: Classify the task
- **Coding / dashboard / UI / technical** → Rosé via Claude Code (see Step 3a)
- **Japan Villas / guest comms / concierge** → Lisa cron job (see Step 3b)
- **Briefing / report / summary / admin** → Jisoo cron job (see Step 3b)
- **Strategy / business decision / unclear** → handle yourself

## Step 2: Update the task record
Edit ${OPENCLAW_WORKSPACE}/kanban-manual.json (id: ${task.id}):
- Set \`assignee\` to the agent doing the work (e.g. "Rosé", "Lisa", "Jisoo")
- Set \`progress\` to: "Delegated to [Agent]: [one-line description]"

## Step 3a: For CODING tasks — spawn Rosé (Claude Code)
Run this in your shell:
\`\`\`bash
claude --dangerously-skip-permissions -p "<full task spec>" --output-format stream-json
\`\`\`
Working directory: /Users/sekaichi/Projects/mission-control

The task spec must include:
- Exactly what to build/change
- Relevant file paths
- How to verify (cd /Users/sekaichi/Projects/mission-control && npm run build)
- When done: update ${OPENCLAW_WORKSPACE}/kanban-manual.json (id: ${task.id}) — set status "done" and progress to a summary

## Step 3b: For non-coding tasks — spawn a cron job
\`\`\`
openclaw cron add --at 1m --agent <lisa|jisoo> --session isolated --no-deliver --delete-after-run --timeout-seconds 300 --model anthropic/claude-sonnet-4-20250514 --name "Task: ${task.title}" --message "<full spec>"
\`\`\`

## Step 4: Monitor and report
For Claude Code: stream the output, report key milestones. When it finishes, confirm status in kanban-manual.json.

## Original Task Prompt
${taskPrompt}`;

    // Fire-and-forget one-shot cron job for Jennie (isolated session so it doesn't conflict with main)
    exec("/opt/homebrew/bin/openclaw", [
      "cron", "add",
      "--at", "1m",
      "--agent", "jennie",
      "--session", "isolated",
      "--no-deliver",
      "--name", `Task: ${task.title}`,
      "--message", jennieMessage,
      "--delete-after-run",
      "--timeout-seconds", "300",
      "--model", "anthropic/claude-sonnet-4-20250514",
      "--json",
    ]).then(async ({ stdout }) => {
      // Store the triggered job id on the task so UI can track it
      try {
        const json = JSON.parse(stdout);
        const jobId = json?.id;
        if (jobId) {
          const current = await readManualTasks();
          const i = current.findIndex((t) => t.id === task.id);
          if (i !== -1) {
            (current[i] as any).activeJobId = jobId;
            (current[i] as any).activeJobStartedAt = new Date().toISOString();
            await writeManualTasks(current);
          }
        }
      } catch {}
    }).catch(() => {/* best effort */});
  }

  // Trigger QA review when task moves to done (1 round only — no infinite loops)
  if (status === "done" && prevStatus !== "done") {
    const task = tasks[idx];
    const isFinalCheck = (task as any).qaFinalCheck === true;
    const alreadyQA = (task as any).qaStatus; // already has a result — skip

    if (!alreadyQA) {
      const qaMessage = isFinalCheck
        ? `FINAL QA CHECK — did the fix address the critique?

Task: "${task.title}"
Original critique: ${(task as any).qaCritique || "(see progress)"}
Fix summary: ${(task as any).progress || "(none)"}

Quickly verify the specific issue was resolved (screenshot if UI task, check build if code).
Be strict — only PASS if the critique is genuinely addressed.

### If PASS — update BOTH fields:
Edit ${OPENCLAW_WORKSPACE}/kanban-manual.json (id: ${task.id}):
- Set qaStatus to "passed"  ← REQUIRED
- Append to progress: "\\n✅ QA passed after fix"

### If FAIL — update BOTH fields:
Edit ${OPENCLAW_WORKSPACE}/kanban-manual.json (id: ${task.id}):
- Set qaStatus to "failed"  ← REQUIRED
- Append to progress: "\\n❌ QA failed: [reason]"
(Do NOT reopen — this is the final check. Task stays done.)`
        : `QA REVIEW

Task just completed. Review it and decide PASS or FAIL. One round only — be thorough.

## Task
"${task.title}"
Assignee: ${task.assignee}
What was done: ${(task as any).progress || "(no progress note)"}

## How to review
- For UI tasks: screenshot http://localhost:3000 and the relevant page, check it looks right with REAL data
- For code tasks: verify build passes (cd /Users/sekaichi/Projects/mission-control && npm run build)
- Check for: wrong/fake data shown, missing edge cases, null errors, visual issues, incomplete requirements

## If PASS — update BOTH fields:
Edit ${OPENCLAW_WORKSPACE}/kanban-manual.json (id: ${task.id}):
- Set qaStatus to "passed"  ← REQUIRED, do not skip
- Append to progress: "\\n✅ QA passed: [one-line reason]"

## If FAIL — update BOTH fields:
Edit ${OPENCLAW_WORKSPACE}/kanban-manual.json (id: ${task.id}):
- Set status to "inProgress"
- Set qaStatus to "reviewing"  ← REQUIRED, do not skip
- Set qaCritique to your specific critique
- Set progress to: "❌ QA failed: [critique]\\n\\nPrevious: ${(task as any).progress || ''}"

Then spawn ONE fix job (coding → Rosé via Claude Code, others → appropriate agent):
openclaw cron add --at 1m --agent jennie --session isolated --no-deliver --delete-after-run --timeout-seconds 300 --model anthropic/claude-sonnet-4-20250514 --name "Fix: ${task.title}" --message "FIXING based on QA critique: [paste critique here]

Original task: ${task.description || task.title}

Fix ONLY the issues in the critique. When done, set status=done and qaFinalCheck=true in ${OPENCLAW_WORKSPACE}/kanban-manual.json (id: ${task.id})."`;

      exec("/opt/homebrew/bin/openclaw", [
        "cron", "add", "--at", "1m",
        "--agent", "jennie", "--session", "isolated", "--no-deliver",
        "--name", isFinalCheck ? `Final QA: ${task.title}` : `QA: ${task.title}`,
        "--message", qaMessage,
        "--delete-after-run", "--timeout-seconds", "180",
        "--model", "anthropic/claude-sonnet-4-20250514", "--json",
      ]).then(async ({ stdout }) => {
        try {
          const json = JSON.parse(stdout);
          const jobId = json?.id;
          if (jobId) {
            const current = await readManualTasks();
            const i = current.findIndex((t) => t.id === task.id);
            if (i !== -1) {
              (current[i] as any).qaJobId = jobId;
              (current[i] as any).qaStartedAt = new Date().toISOString();
              await writeManualTasks(current);
            }
          }
        } catch {}
      }).catch(() => {});
    }
  }

  return NextResponse.json(tasks[idx]);
}

// ── DELETE — remove manual task ────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const tasks = await readManualTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  await writeManualTasks(filtered);
  return NextResponse.json({ ok: true });
}
