"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  User,
  CheckCircle2,
  AlertTriangle,
  Info,
  Circle,
  Timer,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  Zap,
  AlertCircle,
  Repeat,
  X,
  Flag,
  CalendarDays,
  StickyNote,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  Tag,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PageHeader } from "@/components/page-header";

type TaskStatus = "backlog" | "inProgress" | "done";
type TaskPriority = "low" | "medium" | "high" | "urgent";

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  // manual-only enrichment fields
  priority?: TaskPriority;
  notes?: string;
  dueDate?: string;       // ISO date string
  blockers?: string;
  progress?: string;      // what's been done so far
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  // cron-derived fields
  source?: "cron" | "manual";
  cronJobId?: string;
  lastStatus?: "ok" | "error";
  lastRunAt?: number;
  nextRunAt?: number;
  isRecurring?: boolean;
  enabled?: boolean;
  prompt?: string;
}

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  agentId?: string;
  sessionKey?: string;
  schedule: {
    kind: string;
    expr?: string;
    everyMs?: number;
    tz?: string;
  };
  payload: {
    model?: string;
    timeoutSeconds?: number;
  };
  state?: {
    lastRunAtMs?: number;
    nextRunAtMs?: number;
    lastStatus?: string;
    consecutiveErrors?: number;
  };
}

function getJobAgent(job: CronJob): string {
  const key = job.sessionKey ?? "";
  const id = job.agentId ?? "";
  if (key.includes("lisa") || id === "lisa") return "Lisa";
  if (key.includes("rose") || id === "rose") return "Rosé";
  if (key.includes("jisoo") || id === "jisoo") return "Jisoo";
  if (key.includes("jennie") || id === "jennie") return "Jennie";
  return "Jennie";
}

const AGENTS = ["Jennie", "Lisa", "Rosé", "Jisoo"];

const INITIAL_TASKS: Task[] = [];

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  backlog: { label: "Backlog", color: "text-muted-foreground", icon: <Circle className="h-4 w-4" /> },
  inProgress: { label: "In Progress", color: "text-primary/80", icon: <Timer className="h-4 w-4 text-primary/80" /> },
  done: { label: "Done", color: "text-emerald-600 dark:text-emerald-400", icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
};

const ALL_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
// Map cron dow numbers (0=Sun,1=Mon...6=Sat) to display index (0=Mon...6=Sun)
const DOW_MAP: Record<number, string> = { 0:"Sun", 1:"Mon", 2:"Tue", 3:"Wed", 4:"Thu", 5:"Fri", 6:"Sat" };

function parseDow(dow: string): string[] {
  if (dow === "*") return ALL_DAYS;
  const result = new Set<string>();
  dow.split(",").forEach((part) => {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      for (let i = start; i <= end; i++) {
        if (DOW_MAP[i]) result.add(DOW_MAP[i]);
      }
    } else {
      const n = Number(part);
      if (DOW_MAP[n]) result.add(DOW_MAP[n]);
    }
  });
  // Return in Mon-Sun display order
  return ALL_DAYS.filter((d) => result.has(d));
}

// Parse cron expression to human-readable label + time slots
function parseCronSchedule(job: CronJob): { label: string; times: string[]; days: string[] } {
  if (job.schedule.kind === "every" && job.schedule.everyMs) {
    const mins = Math.round(job.schedule.everyMs / 60000);
    if (mins < 60) return { label: `Every ${mins}m`, times: [], days: ALL_DAYS };
    return { label: `Every ${Math.round(mins / 60)}h`, times: [], days: ALL_DAYS };
  }
  if (job.schedule.kind === "cron" && job.schedule.expr) {
    const parts = job.schedule.expr.split(" ");
    if (parts.length >= 5) {
      const [min, hour, , , dow] = parts;
      const timeStr = hour !== "*" && min !== "*"
        ? `${hour.padStart(2, "0")}:${min.padStart(2, "0")}`
        : null;
      const times = timeStr ? [timeStr] : [];
      const days = parseDow(dow);
      return { label: timeStr ?? job.schedule.expr, times, days };
    }
  }
  return { label: "Scheduled", times: [], days: [] };
}

function getNextRunLabel(job: CronJob): string {
  const nextMs = job.state?.nextRunAtMs;
  if (!nextMs) return "";
  const diff = nextMs - Date.now();
  if (diff < 0) return "overdue";
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.round(diff / 3600000);
  if (hrs < 24) return `in ${hrs}h`;
  return `in ${Math.round(diff / 86400000)}d`;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Color by job name hash — muted, elegant palette
const JOB_COLORS = [
  "bg-primary/10 border-primary/20 text-primary/80",
  "bg-muted border-border text-muted-foreground",
  "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
  "bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400",
];
function jobColor(id: string) {
  const n = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return JOB_COLORS[n % JOB_COLORS.length];
}

const AGENT_META: Record<string, { emoji: string; role: string; color: string; ring: string }> = {
  Jennie: { emoji: "🐾", role: "Coordinator",      color: "text-primary/80",                        ring: "ring-primary/30" },
  Lisa:   { emoji: "🌺", role: "Villa Concierge",   color: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/30" },
  Rosé:   { emoji: "🌹", role: "Coding Agent",      color: "text-amber-600 dark:text-amber-400",     ring: "ring-amber-500/30" },
  Jisoo:  { emoji: "❄️", role: "Briefing Agent",    color: "text-cyan-600 dark:text-cyan-400",       ring: "ring-cyan-500/30" },
};

function JobStatusBadge({ job }: { job: CronJob }) {
  const errors = job.state?.consecutiveErrors ?? 0;
  const lastStatus = job.state?.lastStatus;
  const lastRunMs = job.state?.lastRunAtMs;

  if (!job.enabled) return (
    <span className="flex items-center gap-1 text-muted-foreground/50 text-[11px]">
      <Circle className="h-2.5 w-2.5" /> Paused
    </span>
  );
  if (errors > 0) return (
    <span className="flex items-center gap-1 text-rose-500/80 text-[11px]">
      <XCircle className="h-2.5 w-2.5 shrink-0" />
      Failed{errors > 1 ? ` ×${errors}` : ""}
    </span>
  );
  if (lastStatus === "ok") return (
    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px]">
      <CheckCircle className="h-2.5 w-2.5 shrink-0" /> OK
    </span>
  );
  if (!lastRunMs) return <span className="text-[11px] text-muted-foreground/40">Never run</span>;
  return <span className="text-muted-foreground/50 text-[11px]">—</span>;
}

function AgentPanel({ agent, jobs }: { agent: string; jobs: CronJob[] }) {
  const meta = AGENT_META[agent] ?? { emoji: "🤖", role: "Agent", color: "text-muted-foreground", ring: "ring-border" };
  const enabled = jobs.filter((j) => j.enabled);
  const paused  = jobs.filter((j) => !j.enabled);
  const hasError = enabled.some((j) => (j.state?.consecutiveErrors ?? 0) > 0);
  const allOk    = enabled.length > 0 && enabled.every((j) => j.state?.lastStatus === "ok" && !j.state?.consecutiveErrors);

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden ring-1", meta.ring)}>
      {/* Agent header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
        <span className="text-xl leading-none">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold", meta.color)}>{agent}</p>
          <p className="text-[11px] text-muted-foreground/60">{meta.role}</p>
        </div>
        {/* Overall health indicator */}
        {hasError ? (
          <span className="flex items-center gap-1 text-xs text-rose-500/80 font-medium">
            <XCircle className="h-3.5 w-3.5" /> Error
          </span>
        ) : allOk ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle className="h-3.5 w-3.5" /> All OK
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40">{enabled.length} job{enabled.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Job rows */}
      {jobs.length === 0 ? (
        <p className="px-4 py-3 text-xs text-muted-foreground/40">No scheduled jobs</p>
      ) : (
        <div className="divide-y divide-border/60">
          {[...enabled, ...paused].map((job) => {
            const { label: schedLabel } = parseCronSchedule(job);
            const nextLabel = getNextRunLabel(job);
            const lastRunMs = job.state?.lastRunAtMs;
            const lastRunLabel = lastRunMs
              ? new Date(lastRunMs).toLocaleString("en-US", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false })
              : "—";

            return (
              <div key={job.id} className={cn("px-4 py-2.5 flex items-center gap-3", !job.enabled && "opacity-45")}>
                {/* Name + schedule */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{job.name}</p>
                  <p className="text-[11px] text-muted-foreground/60 font-mono">{schedLabel}</p>
                </div>
                {/* Status */}
                <div className="shrink-0 text-right space-y-0.5">
                  <JobStatusBadge job={job} />
                  <p className="text-[11px] text-muted-foreground/50 font-mono">{lastRunLabel}</p>
                </div>
                {/* Next run */}
                {nextLabel && (
                  <span className={cn(
                    "shrink-0 text-[11px] tabular-nums w-14 text-right",
                    nextLabel === "overdue" ? "text-rose-500/80 font-medium" : "text-muted-foreground/50"
                  )}>
                    {nextLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecurringCalendar({ jobs, filter }: { jobs: CronJob[]; filter: string }) {
  const filtered = filter === "all" ? jobs : jobs.filter((j) => getJobAgent(j).toLowerCase() === filter.toLowerCase());

  const timeSlots: Record<string, CronJob[]> = {};
  const everyJobs: CronJob[] = [];

  filtered.forEach((job) => {
    if (!job.enabled) return;
    const { times } = parseCronSchedule(job);
    if (times.length > 0) {
      times.forEach((t) => {
        if (!timeSlots[t]) timeSlots[t] = [];
        timeSlots[t].push(job);
      });
    } else {
      everyJobs.push(job);
    }
  });

  const sortedTimes = Object.keys(timeSlots).sort();

  const agentOrder = ["Jennie", "Lisa", "Rosé", "Jisoo"];
  const byAgent: Record<string, CronJob[]> = {};
  agentOrder.forEach((a) => { byAgent[a] = []; });
  jobs.forEach((job) => {
    const agent = getJobAgent(job);
    if (!byAgent[agent]) byAgent[agent] = [];
    byAgent[agent].push(job);
  });
  const visibleAgents = filter === "all"
    ? agentOrder
    : agentOrder.filter((a) => a.toLowerCase() === filter.toLowerCase());

  return (
    <div className="space-y-4">
      {/* ── Weekly calendar grid ── */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-8 border-b border-border bg-muted/30">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Time</div>
          {DAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-xs font-medium text-center text-muted-foreground">{d}</div>
          ))}
        </div>

        {sortedTimes.map((time) => (
          <div key={time} className="grid grid-cols-8 border-b border-border last:border-0">
            <div className="flex items-center px-3 py-2.5 text-xs text-muted-foreground font-mono">{time}</div>
            {DAYS.map((day) => (
              <div key={day} className="px-1 py-1.5 flex flex-col gap-1">
                {timeSlots[time]
                  .filter((job) => parseCronSchedule(job).days.includes(day))
                  .map((job) => (
                    <div key={job.id} className={cn("rounded border px-1.5 py-1 text-xs leading-tight", jobColor(job.id))} title={job.name}>
                      <p className="font-medium truncate">{job.name}</p>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        ))}

        {everyJobs.length > 0 && (
          <div className="grid grid-cols-8 bg-muted/10">
            <div className="flex items-start px-3 py-2.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 mt-0.5" />
            </div>
            {DAYS.map((day) => (
              <div key={day} className="px-1 py-1.5 flex flex-col gap-1">
                {everyJobs.map((job) => {
                  const { label } = parseCronSchedule(job);
                  return (
                    <div key={job.id} className={cn("rounded border px-1.5 py-1 text-xs leading-tight", jobColor(job.id))} title={job.name}>
                      <p className="font-medium truncate">{job.name}</p>
                      <p className="opacity-70">{label}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Agent panels ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {visibleAgents.map((agent) => (
          <AgentPanel key={agent} agent={agent} jobs={byAgent[agent] ?? []} />
        ))}
      </div>
    </div>
  );
}

// ── Priority helpers ─────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  low:    { label: "Low",    color: "text-muted-foreground",                          dot: "bg-muted-foreground/40" },
  medium: { label: "Medium", color: "text-amber-600 dark:text-amber-400",             dot: "bg-amber-500/60" },
  high:   { label: "High",   color: "text-orange-600 dark:text-orange-400",           dot: "bg-orange-500/70" },
  urgent: { label: "Urgent", color: "text-rose-600 dark:text-rose-400",               dot: "bg-rose-500" },
};

// ── Agent Conversation (live job log) ────────────────────────────────────────

function AgentConversation({ jobId }: { jobId: string }) {
  const [data, setData] = useState<{
    running: boolean;
    finished: boolean;
    lastStatus: string | null;
    messages: { role: string; content: string }[];
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/kanban/job-status?jobId=${jobId}`);
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          // Auto-scroll to bottom
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [jobId]);

  const isRunning = data?.running || !data;
  const isDone = data?.finished && data.lastStatus === "ok";
  const isFailed = data?.finished && data.lastStatus !== "ok";
  const messages = data?.messages ?? [];

  return (
    <div className="rounded-md border border-border/60 overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 bg-muted/40">
        {isRunning ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-medium text-primary/80">Jennie is working…</span>
          </>
        ) : isDone ? (
          <>
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            <span className="font-medium text-emerald-500">Completed</span>
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3 text-rose-500" />
            <span className="font-medium text-rose-500">Failed</span>
          </>
        )}
      </div>

      {/* Output stream */}
      <div ref={containerRef} className="max-h-72 overflow-y-auto bg-[var(--background)] px-3 py-2.5 space-y-2.5">
        {messages.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground/40 py-1 font-mono">
            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            <span className="animate-pulse">Waiting for agent to start…</span>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i}>
              {m.role === "tool" ? (
                <div className="flex items-center gap-1.5 text-muted-foreground/50 font-mono">
                  <span className="text-primary/40">›</span>
                  <span>{m.content}</span>
                </div>
              ) : (
                <div className="text-foreground/85 leading-relaxed whitespace-pre-wrap font-sans">
                  {m.content}
                </div>
              )}
            </div>
          ))
        )}
        {isRunning && messages.length > 0 && (
          <div className="flex items-center gap-1.5 text-muted-foreground/40 font-mono">
            <span className="inline-flex gap-0.5">
              <span className="animate-bounce delay-0">·</span>
              <span className="animate-bounce delay-100">·</span>
              <span className="animate-bounce delay-200">·</span>
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Task Detail Panel ─────────────────────────────────────────────────────────

function TaskDetailPanel({
  task,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const isCron = task.source === "cron";
  const [editing, setEditing] = useState<Partial<Task>>({});
  const isDirty = Object.keys(editing).length > 0;

  const val = <K extends keyof Task>(k: K): Task[K] =>
    (editing[k] !== undefined ? editing[k] : task[k]) as Task[K];

  const set = (k: keyof Task, v: any) => setEditing((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!isDirty) return;
    const updates = { ...editing };

    // If description was edited (and no manual title change), regenerate title
    if (updates.description && !updates.title) {
      try {
        const res = await fetch("/api/generate-title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: updates.description }),
        });
        const data = await res.json();
        if (data?.title) updates.title = data.title;
      } catch {}
    }

    await onSave(task.id, updates);
    setEditing({});
  };

  const priorityCfg = PRIORITY_CONFIG[val("priority") ?? "medium"];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2 min-w-0">
            {task.isRecurring ? (
              <Repeat className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            ) : isCron ? (
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-primary/60" />
            )}
            {isCron ? (
              <h2 className="text-base font-semibold truncate">{task.title}</h2>
            ) : (
              <input
                className="text-base font-semibold bg-transparent border-none outline-none w-full"
                value={val("title") as string ?? ""}
                onChange={(e) => set("title", e.target.value)}
              />
            )}
          </div>
          <button onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Status + Assignee row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("text-xs capitalize",
              task.status === "done"       ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
              task.status === "inProgress" ? "bg-primary/10 text-primary/80 border-primary/20" :
              "bg-muted text-muted-foreground"
            )}>
              {task.status === "inProgress" ? "In Progress" : task.status === "done" ? "Done" : "Backlog"}
            </Badge>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{task.assignee}</span>
            </div>

            {task.lastStatus === "error" && (
              <div className="flex items-center gap-1 text-xs text-rose-500/80">
                <AlertCircle className="h-3 w-3" /><span>Last run errored</span>
              </div>
            )}
          </div>

          {/* Prompt — single field for manual tasks, full prompt for cron */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ChevronRight className="h-3 w-3" />
                {isCron ? "Prompt" : "What needs to be done"}
              </label>
              {isCron && <span className="text-[10px] text-muted-foreground/50">Saved to cron job</span>}
              {!isCron && task.status === "backlog" && (
                <span className="text-[10px] text-muted-foreground/50">Jennie analyzes this when moved to In Progress</span>
              )}
            </div>
            <Textarea
              value={(val(isCron ? "prompt" : "description") as string) ?? ""}
              onChange={(e) => set(isCron ? "prompt" : "description", e.target.value)}
              rows={isCron ? 12 : 5}
              className={cn("resize-y", isCron ? "text-xs font-mono leading-relaxed" : "text-sm")}
              placeholder={isCron ? "No prompt configured" : "Describe what needs to be done…"}
            />
          </div>

          {/* Priority (manual only) */}
          {!isCron && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Flag className="h-3 w-3" />Priority
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {(["low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => {
                  const cfg = PRIORITY_CONFIG[p];
                  const active = (val("priority") ?? "medium") === p;
                  return (
                    <button key={p} onClick={() => set("priority", p)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                        active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
                      )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-primary-foreground" : cfg.dot)} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress / Agent conversation */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CheckCircle className="h-3 w-3" />Progress
            </label>
            {isCron ? (
              <p className="text-sm text-foreground/70 whitespace-pre-wrap">
                {task.lastRunAt
                  ? `Last run: ${new Date(task.lastRunAt).toLocaleString("en-US", { timeZone: "Asia/Tokyo", dateStyle: "medium", timeStyle: "short" })}`
                  : "Not yet run today"}
                {task.nextRunAt && !task.isRecurring
                  ? `\nNext run: ${new Date(task.nextRunAt).toLocaleString("en-US", { timeZone: "Asia/Tokyo", dateStyle: "medium", timeStyle: "short" })}`
                  : ""}
              </p>
            ) : (task as any).qaJobId ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs">
                  {(task as any).qaStatus === "passed" ? (
                    <><CheckCircle className="h-3 w-3 text-emerald-500" /><span className="font-medium text-emerald-500">QA Passed</span></>
                  ) : (task as any).qaStatus === "failed" ? (
                    <><XCircle className="h-3 w-3 text-rose-500" /><span className="font-medium text-rose-500">QA Failed</span></>
                  ) : (
                    <><AlertTriangle className="h-3 w-3 text-amber-500" /><span className="font-medium text-amber-500">QA Reviewing…</span></>
                  )}
                </div>
                <AgentConversation jobId={(task as any).qaJobId} />
              </div>
            ) : (task as any).activeJobId ? (
              <AgentConversation jobId={(task as any).activeJobId} />
            ) : (
              <p className={cn(
                "text-sm whitespace-pre-wrap rounded-md px-3 py-2 border border-border/50 bg-muted/30 min-h-[4rem]",
                !task.progress && "text-muted-foreground/40 italic"
              )}>
                {task.progress || "Jennie will fill this in when the task is picked up…"}
              </p>
            )}
          </div>

          {/* Metadata footer */}
          {task.createdAt && (
            <p className="text-xs text-muted-foreground/50 pt-2 border-t border-border">
              Created {new Date(task.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
              {task.updatedAt && task.updatedAt !== task.createdAt
                ? ` · Updated ${new Date(task.updatedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}`
                : ""}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-border px-5 py-3 flex items-center justify-between gap-3">
          {!isCron ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onDelete(task.id); onClose(); }}
              className="text-muted-foreground hover:text-destructive text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1.5" />Delete
            </Button>
          ) : (
            <span className="text-[10px] text-muted-foreground/40">Prompt changes update the cron job</span>
          )}
          <Button size="sm" onClick={handleSave} disabled={!isDirty} className="text-xs">
            Save changes
          </Button>
        </div>
      </div>
    </>
  );
}

function TaskCardInner({
  task,
  onDelete,
  onOpen,
  isDragging = false,
}: {
  task: Task;
  onDelete: (id: string) => void;
  onOpen: (task: Task) => void;
  isDragging?: boolean;
}) {
  const isCron = task.source === "cron";
  const hasError = task.lastStatus === "error";
  const priorityCfg = PRIORITY_CONFIG[task.priority ?? "medium"];
  const isActive = !isCron && task.status === "inProgress" && !!(task as any).activeJobId;
  const progress: string = (task as any).progress ?? "";
  const qaStatus: "passed" | "failed" | "reviewing" | null =
    (task as any).qaStatus ??
    (progress.includes("✅ QA passed") ? "passed" :
     progress.includes("❌ QA failed") && task.status === "done" ? "failed" : null);
  const isQAReviewing = !isCron && task.status === "done" && !!(task as any).qaJobId && !qaStatus;

  return (
    <div
      onClick={() => onOpen(task)}
      className={cn(
        "rounded-lg border p-3 shadow-sm space-y-2 select-none transition-colors cursor-pointer",
        isCron
          ? "border-dashed bg-muted/20 hover:bg-muted/40 hover:border-border"
          : "bg-card hover:border-primary/30 hover:bg-muted/20",
        isDragging && "opacity-50 ring-2 ring-primary/40",
        isActive && "border-primary/50 ring-1 ring-primary/20 bg-primary/5",
        isQAReviewing && "border-amber-500/40 bg-amber-500/5",
        !isActive && !isQAReviewing && (hasError ? "border-rose-500/30" : isCron ? "border-border/60" : "border-border"),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isActive ? (
            <Loader2 className="h-3 w-3 shrink-0 text-primary animate-spin" />
          ) : task.isRecurring ? (
            <Repeat className="h-3 w-3 shrink-0 text-muted-foreground/40" />
          ) : isCron ? (
            <Clock className="h-3 w-3 shrink-0 text-muted-foreground/40" />
          ) : null}
          <p className="text-sm font-medium leading-tight truncate">{task.title}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isActive ? (
            <span className="text-[10px] font-medium text-primary/80 bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 animate-pulse">
              Working…
            </span>
          ) : isQAReviewing ? (
            <span className="text-[10px] font-medium text-amber-600/80 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 animate-pulse">
              Reviewing…
            </span>
          ) : qaStatus === "passed" ? (
            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">
              ✓ QA
            </span>
          ) : qaStatus === "failed" ? (
            <span className="text-[10px] font-medium text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5">
              ✗ QA
            </span>
          ) : isCron ? (
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/50 border border-border/50 rounded px-1 py-px leading-tight">
              auto
            </span>
          ) : !isCron && task.priority && task.priority !== "low" ? (
            <span className={cn("h-2 w-2 rounded-full", priorityCfg.dot)} />
          ) : null}
        </div>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
          <User className="h-3 w-3" />
          <span>{task.assignee}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {task.dueDate && (
            <span className="text-xs text-muted-foreground/60 flex items-center gap-0.5">
              <CalendarDays className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
          {hasError && (
            <div className="flex items-center gap-0.5 text-xs text-rose-500/70">
              <AlertCircle className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onDelete,
  onOpen,
}: {
  task: Task;
  onDelete: (id: string) => void;
  onOpen: (task: Task) => void;
}) {
  const isCron = task.source === "cron";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isCron });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isCron ? "pointer" : isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...(!isCron ? { ...attributes, ...listeners } : {})}>
      <TaskCardInner task={task} onDelete={onDelete} onOpen={onOpen} isDragging={isDragging} />
    </div>
  );
}

// ── Column header ────────────────────────────────────────────────────────────
function KanbanColHeader({ status, count }: { status: TaskStatus; count: number }) {
  const config = statusConfig[status];
  return (
    <div className="flex items-center gap-2 pb-1">
      {config.icon}
      <h3 className={cn("text-sm font-semibold", config.color)}>{config.label}</h3>
      <Badge variant="outline" className="ml-auto text-xs px-1.5 py-0">{count}</Badge>
    </div>
  );
}

// ── Unified column cell (cron + manual mixed) ────────────────────────────────
function ColumnCell({
  status, tasks, onDelete, onOpen, onAddToBacklog,
}: {
  status: TaskStatus;
  tasks: Task[];
  onDelete: (id: string) => void;
  onOpen: (task: Task) => void;
  onAddToBacklog?: (prompt: string, priority: TaskPriority) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [adding, setAdding] = useState(false);
  const [inlinePrompt, setInlinePrompt] = useState("");
  const [inlinePriority, setInlinePriority] = useState<TaskPriority>("medium");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const startAdding = () => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 50); };
  const commitAdd = () => {
    if (inlinePrompt.trim() && onAddToBacklog) onAddToBacklog(inlinePrompt.trim(), inlinePriority);
    setInlinePrompt(""); setInlinePriority("medium"); setAdding(false);
  };
  const cancelAdd = () => { setInlinePrompt(""); setAdding(false); };

  const manual = tasks.filter((t) => t.source !== "cron");
  const isEmpty = tasks.length === 0 && !adding;

  return (
    <div
      ref={setNodeRef}
      className={cn("rounded-lg p-1 transition-colors flex flex-col gap-1.5", isOver && "bg-primary/5 ring-1 ring-primary/20")}
    >
      <SortableContext items={manual.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {isEmpty ? (
          status === "backlog" ? (
            <button onClick={startAdding}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 py-3 text-xs text-muted-foreground/50 hover:border-primary/30 hover:text-primary/60 transition-colors w-full"
            >
              <Plus className="h-3 w-3" /><span>Click to add task</span>
            </button>
          ) : (
            <p className="text-xs text-muted-foreground/40 px-1 py-1">—</p>
          )
        ) : (
          <>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onDelete={onDelete} onOpen={onOpen} />
            ))}
          </>
        )}

        {adding && (
          <div className="rounded-lg border border-primary/30 bg-card p-3 space-y-2 shadow-sm w-full">
            <Textarea
              ref={inputRef}
              placeholder="What needs to be done? Jennie will analyze and delegate when moved to In Progress."
              value={inlinePrompt}
              onChange={(e) => setInlinePrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commitAdd(); if (e.key === "Escape") cancelAdd(); }}
              rows={3}
              className="text-sm resize-none w-full"
            />
            <div className="flex flex-wrap gap-1">
              {(["low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => {
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <button key={p} onClick={() => setInlinePriority(p)}
                    className={cn("flex items-center gap-1 rounded px-2 py-0.5 text-xs border transition-colors",
                      inlinePriority === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", inlinePriority === p ? "bg-primary-foreground" : cfg.dot)} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <p className="text-[10px] text-muted-foreground/50">⌘↵ to submit</p>
              <div className="flex gap-1.5 shrink-0">
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={cancelAdd}>Cancel</Button>
                <Button size="sm" className="h-6 text-xs px-2" onClick={commitAdd} disabled={!inlinePrompt.trim()}>Add</Button>
              </div>
            </div>
          </div>
        )}
      </SortableContext>

      {/* Add task button (when tasks exist) */}
      {status === "backlog" && !isEmpty && !adding && (
        <button onClick={startAdding}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-primary/70 hover:bg-muted/40 transition-colors w-full text-left shrink-0"
        >
          <Plus className="h-3 w-3" />Add task
        </button>
      )}
    </div>
  );
}

// ── Board ─────────────────────────────────────────────────────────────────────
function KanbanBoard({
  tasks, onDelete, onOpen, onAddToBacklog,
}: {
  tasks: Task[];
  onDelete: (id: string) => void;
  onOpen: (task: Task) => void;
  onAddToBacklog: (prompt: string, priority: TaskPriority) => void;
}) {
  const columns = (["backlog", "inProgress", "done"] as TaskStatus[]);

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="grid grid-cols-3 gap-3 min-w-[560px]">
        {/* Column headers */}
        {columns.map((status) => {
          const count = tasks.filter((t) => t.status === status).length;
          return <KanbanColHeader key={status} status={status} count={count} />;
        })}

        {/* Unified column cells */}
        {columns.map((status) => {
          const colTasks = tasks.filter((t) => t.status === status);
          return (
            <ColumnCell
              key={status}
              status={status}
              tasks={colTasks}
              onDelete={onDelete}
              onOpen={onOpen}
              onAddToBacklog={status === "backlog" ? onAddToBacklog : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}



// ── Date helpers ──────────────────────────────────────────────────────────────

function todayJST(): string {
  return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00+09:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const today = todayJST();
  const yesterday = offsetDate(today, -1);
  const d = new Date(dateStr + "T12:00:00+09:00");
  const dayName = d.toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Tokyo" });
  const monthDay = d.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "Asia/Tokyo" });
  if (dateStr === today) return `Today · ${monthDay}`;
  if (dateStr === yesterday) return `Yesterday · ${monthDay}`;
  return `${dayName} · ${monthDay}`;
}

export default function TasksPage() {
  const [selectedDate, setSelectedDate] = useState<string>(todayJST());
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; type: string; title: string; message: string }[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<Set<string>>(new Set());
  const [agentFilter, setAgentFilter] = useState("all");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dragStartStatus, setDragStartStatus] = useState<TaskStatus | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const isToday = selectedDate === todayJST();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Load kanban tasks from API (cron-derived + manual)
  const loadTasks = async (date?: string) => {
    try {
      const d = date ?? selectedDate;
      const url = d === todayJST() ? "/api/kanban" : `/api/kanban?date=${d}`;
      const res = await fetch(url);
      const data = await res.json();
      const newTasks: Task[] = data.tasks ?? [];
      setTasks(newTasks);
      // Keep detail panel in sync so activeJobId etc. appear immediately
      setSelectedTask((prev) => {
        if (!prev) return prev;
        const updated = newTasks.find((t) => t.id === prev.id);
        return updated ?? prev;
      });
    } catch {}
  };

  const loadNotifications = () =>
    fetch("/api/smart-notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []))
      .catch(() => {});

  useEffect(() => {
    loadTasks(selectedDate);
    if (isToday) loadNotifications();
    fetch("/api/cron").then((r) => r.json()).then(setCronJobs).catch(() => {});
    const interval = isToday
      ? setInterval(() => { loadTasks(selectedDate); loadNotifications(); }, 15000)
      : undefined;
    return () => { if (interval) clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const handleAddToBacklog = async (prompt: string, priority: TaskPriority) => {
    // Use first sentence as placeholder title while AI generates a better one
    const placeholder = prompt.split(/[.\n]/)[0].trim().slice(0, 80) || prompt.slice(0, 80);
    try {
      const res = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: placeholder, description: prompt, priority, assignee: "Jennie" }),
      });
      const newTask = await res.json();
      await loadTasks();

      // Fire async AI title generation — non-blocking
      if (newTask?.id) {
        fetch("/api/generate-title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: prompt }),
        })
          .then((r) => r.json())
          .then(async (data) => {
            if (data?.title) {
              await fetch("/api/kanban", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: newTask.id, title: data.title }),
              });
              await loadTasks();
            }
          })
          .catch(() => {/* placeholder title stays if generation fails */});
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedTask?.id === id) setSelectedTask(null);
    try {
      await fetch(`/api/kanban?id=${id}`, { method: "DELETE" });
    } catch {}
  };

  const handleSave = async (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
    setSelectedTask((prev) => prev?.id === id ? { ...prev, ...updates } : prev);
    try {
      await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates, updatedAt: new Date().toISOString() }),
      });
    } catch {}
  };

  const handleOpen = (task: Task) => setSelectedTask(task);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
    setDragStartStatus(task?.status ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? String(over.id) : null);

    if (!over) return;
    const overedId = String(over.id);
    const activeId = String(event.active.id);

    const draggedTask = tasks.find((t) => t.id === activeId);
    if (!draggedTask || draggedTask.source === "cron") return;

    // If dragging over a column droppable
    const targetColumn = (["backlog", "inProgress", "done"] as TaskStatus[]).find(
      (c) => c === overedId
    );
    if (targetColumn) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: targetColumn } : t))
      );
      return;
    }

    // If dragging over another task card — move to that card's column
    const overTask = tasks.find((t) => t.id === overedId);
    if (overTask && overTask.status !== draggedTask.status) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: overTask.status } : t))
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const startStatus = dragStartStatus;
    setActiveTask(null);
    setDragStartStatus(null);
    setOverId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const draggedTask = tasks.find((t) => t.id === activeId);
    if (!draggedTask || draggedTask.source === "cron") return;

    const overTask = tasks.find((t) => t.id === overId);
    const newStatus = draggedTask.status;

    // Reorder within same column
    if (overTask && startStatus === overTask.status && startStatus === newStatus) {
      setTasks((prev) => {
        const col = prev.filter((t) => t.status === newStatus);
        const others = prev.filter((t) => t.status !== newStatus);
        const oldIdx = col.findIndex((t) => t.id === activeId);
        const newIdx = col.findIndex((t) => t.id === overId);
        return [...others, ...arrayMove(col, oldIdx, newIdx)];
      });
    }

    // Persist status change if it moved columns
    if (startStatus && newStatus && startStatus !== newStatus) {
      try {
        await fetch("/api/kanban", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: activeId, status: newStatus }),
        });
      } catch {}
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" subtitle="Manage and delegate work across your agent team" />

      {/* Kanban Board */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Zap className="h-4 w-4 text-muted-foreground shrink-0" />
            <CardTitle className="text-base">Daily Board</CardTitle>

            {/* Date navigator */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setSelectedDate((d) => offsetDate(d, -1))}
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Previous day"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded",
                isToday
                  ? "text-primary/80 bg-primary/8"
                  : "text-muted-foreground bg-muted/50"
              )}>
                {formatDateLabel(selectedDate)}
              </span>
              <button
                onClick={() => setSelectedDate((d) => {
                  const next = offsetDate(d, 1);
                  return next > todayJST() ? d : next;
                })}
                disabled={isToday}
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next day"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(todayJST())}
                  className="text-[11px] text-primary/70 hover:text-primary border border-primary/30 hover:border-primary/60 rounded px-1.5 py-0.5 transition-colors ml-0.5"
                >
                  Today
                </button>
              )}
            </div>

            <Badge variant="outline" className="text-xs ml-auto">
              {tasks.filter((t) => t.source === "cron").length} scheduled
            </Badge>
            {isToday && (
              <button
                onClick={() => { loadTasks(); loadNotifications(); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Inline notifications */}
          {notifications.filter((n) => !dismissedNotifs.has(n.id)).length > 0 && (
            <div className="mt-2 space-y-1">
              {notifications.filter((n) => !dismissedNotifs.has(n.id)).map((n) => {
                const Icon = n.type === "alert" || n.type === "warning" ? AlertTriangle
                  : n.type === "success" ? CheckCircle2 : Info;
                const cls = n.type === "alert" ? "text-rose-500/80"
                  : n.type === "warning" ? "text-amber-500/80"
                  : n.type === "success" ? "text-emerald-500/80"
                  : "text-primary/70";
                const bg = n.type === "alert" ? "bg-rose-500/5 border-rose-500/20"
                  : n.type === "warning" ? "bg-amber-500/5 border-amber-500/20"
                  : n.type === "success" ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-muted/40 border-border/40";
                return (
                  <div key={n.id} className={cn("flex items-start gap-2 rounded px-2.5 py-1.5 text-xs border group", bg)}>
                    <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", cls)} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{n.title}</span>
                      <span className="text-muted-foreground/70 ml-1.5">{n.message}</span>
                    </div>
                    <button onClick={() => setDismissedNotifs((p) => new Set([...p, n.id]))}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-muted-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-2">
          {!isToday && (
            <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground/60 bg-muted/30 rounded-md px-3 py-2 border border-border/40">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              Viewing {formatDateLabel(selectedDate)} — read-only snapshot
            </div>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={isToday ? handleDragStart : () => {}}
            onDragOver={isToday ? handleDragOver : () => {}}
            onDragEnd={isToday ? handleDragEnd : () => {}}
          >
            <KanbanBoard
              tasks={tasks}
              onDelete={isToday ? handleDelete : () => {}}
              onOpen={handleOpen}
              onAddToBacklog={isToday ? handleAddToBacklog : () => {}}
            />
            <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
              {activeTask ? (
                <div className="rotate-1 opacity-95">
                  <TaskCardInner task={activeTask} onDelete={() => {}} onOpen={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Task detail panel */}
          {selectedTask && (
            <TaskDetailPanel
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Recurring Tasks Calendar */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Recurring Tasks</CardTitle>
            <Badge variant="outline" className="text-xs">
              {cronJobs.filter((j) => j.enabled).length} active
            </Badge>
            {/* Agent filter */}
            <div className="ml-auto flex items-center gap-1">
              {["all", "Jennie", "Lisa", "Rosé", "Jisoo"].map((agent) => (
                <Button
                  key={agent}
                  variant={agentFilter === agent ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setAgentFilter(agent)}
                >
                  {agent === "all" ? "All Agents" : agent}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {cronJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading scheduled tasks...</p>
          ) : (
            <RecurringCalendar jobs={cronJobs} filter={agentFilter} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
