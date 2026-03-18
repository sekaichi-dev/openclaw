"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, TrendingDown, Activity, Clock, AlertTriangle, CheckCircle2, Info, X, FileText, ChevronDown, ChevronUp, Save, Loader2 } from "lucide-react";
import { usePolling } from "@/hooks/use-polling";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// ── Per-agent file paths (relative to OPENCLAW_HOME) ────────────────────────
const AGENT_FILE_PATHS: Record<string, string[]> = {
  Jennie: ["workspace/SOUL.md", "workspace/USER.md", "workspace/AGENTS.md", "workspace/IDENTITY.md", "workspace/TOOLS.md", "workspace/HEARTBEAT.md", "workspace/MEMORY.md"],
  Lisa:   ["agents/lisa/SOUL.md", "agents/lisa/USER.md", "agents/lisa/AGENTS.md", "agents/lisa/IDENTITY.md", "agents/lisa/TOOLS.md", "agents/lisa/HEARTBEAT.md"],
  Rosé:   ["agents/rose/SOUL.md", "agents/rose/USER.md", "agents/rose/AGENTS.md", "agents/rose/IDENTITY.md", "agents/rose/TOOLS.md", "agents/rose/HEARTBEAT.md"],
  Jisoo:  ["agents/jisoo/SOUL.md", "agents/jisoo/USER.md", "agents/jisoo/AGENTS.md", "agents/jisoo/IDENTITY.md", "agents/jisoo/TOOLS.md", "agents/jisoo/HEARTBEAT.md"],
};


// ── Single inline file editor ────────────────────────────────────────────────
function InlineFileEditor({ filePath }: { filePath: string }) {
  const [content, setContent] = useState("");
  const [original, setOriginal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  const fileName = filePath.split("/").pop() ?? filePath;
  const isDirty = content !== original;

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/files?path=${encodeURIComponent(filePath)}&read=true`)
      .then(r => r.json())
      .then(d => { setContent(d.content ?? ""); setOriginal(d.content ?? ""); })
      .finally(() => setLoading(false));
  }, [open, filePath]);

  const save = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath, content }),
      });
      setOriginal(content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save file:", error);
      // TODO: Add error toast notification
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      {/* File header — always visible, click to expand */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/40 transition-colors"
      >
        <FileText className="h-3 w-3 shrink-0 text-muted-foreground/60" />
        <span className="text-xs font-medium flex-1">{fileName}</span>
        {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />}
        {open ? <ChevronUp className="h-3 w-3 text-muted-foreground/50" /> : <ChevronDown className="h-3 w-3 text-muted-foreground/50" />}
      </button>

      {/* Expanded editor */}
      {open && (
        <div className="border-t border-border/40">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full resize-none bg-muted/20 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-foreground focus:outline-none min-h-[160px]"
                spellCheck={false}
              />
              <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-border/40 bg-muted/10">
                {saved && <span className="text-[11px] text-emerald-500">Saved ✓</span>}
                <button
                  onClick={save}
                  disabled={!isDirty || saving}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Agent Files Row ──────────────────────────────────────────────────────────
function AgentFilesRow({ agentName }: { agentName: string }) {
  const files = AGENT_FILE_PATHS[agentName] ?? [];

  return (
    <div className="mt-3 border-t border-border/30 pt-3 space-y-1.5 text-left w-full">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50 px-0.5">
        <FileText className="h-3 w-3" />Files
      </p>
      {files.map(fp => (
        <InlineFileEditor key={fp} filePath={fp} />
      ))}
    </div>
  );
}

interface AgentStatus {
  agent: string;
  status: string;
  model: string;
  lastActivity: string | null;
  contextUsed: number;
  totalTokens: number;
  contextTokens: number;
  activeSessions: number;
  roseActive?: boolean;
}

interface AgentInfo {
  id: string;
  name: string;
  emoji: string;
  role: string;
  model: string;
  modelShort: string;
  pricing: { input: number; output: number; tier: string } | null;
  status: string;
  type: string;
}

interface AgentsData {
  agents: AgentInfo[];
  costSummary: {
    estimatedMonthly: number;
    opusBaseline: number;
    savingsPercent: number;
  } | null;
}

interface SmartNotification {
  id: string;
  type: "alert" | "success" | "info" | "warning";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  actionable: boolean;
}

interface NotificationsData {
  notifications: SmartNotification[];
  unreadCount: number;
}

interface KanbanTask {
  assignee: string;
  status: string;
  title?: string;
  description?: string;
  source: string;
  activeJobId?: string;
}

interface KanbanData { tasks: KanbanTask[]; }

const NOTIF_ICON = {
  alert:   { Icon: AlertTriangle, cls: "text-rose-500/80" },
  warning: { Icon: AlertTriangle, cls: "text-amber-500/80" },
  success: { Icon: CheckCircle2,  cls: "text-emerald-500/80" },
  info:    { Icon: Info,          cls: "text-primary/70" },
};

export function AgentsOverviewCard({ className }: { className?: string }) {
  const { data: statusData, loading: statusLoading } = usePolling<AgentStatus>("/api/status", 10000);
  const { data: agentsData, loading: agentsLoading } = usePolling<AgentsData>("/api/agents", 30000);
  const { data: notifsData } = usePolling<NotificationsData>("/api/smart-notifications", 30000);
  const { data: kanbanData } = usePolling<KanbanData>("/api/kanban", 15000);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const loading = statusLoading || agentsLoading;
  
  const tierColor: Record<string, string> = {
    Frontier: "bg-rose-500/10 text-rose-400/80 border-rose-500/20",
    Standard: "bg-primary/10 text-primary/80 border-primary/20",
    Fast:     "bg-emerald-500/10 text-emerald-500/80 border-emerald-500/20",
  };

  const agentColor: Record<string, string> = {
    Jennie: "text-foreground",
    Lisa:   "text-foreground",
    Rosé:   "text-foreground",
    Jisoo:  "text-foreground",
  };

  if (loading || !agentsData || !agentsData.agents || !Array.isArray(agentsData.agents)) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Agents Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isMainActive = statusData?.status === "active";
  const roseActive = statusData?.roseActive ?? false;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Agents Overview</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {agentsData.costSummary && agentsData.costSummary.savingsPercent > 0 && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
              <TrendingDown className="mr-1 h-3 w-3" />
              {agentsData.costSummary.savingsPercent}% saved
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">

        {/* Notifications — top of card */}
        {(() => {
          const notifications = (notifsData?.notifications ?? []).filter((n) => !dismissed.has(n.id));
          if (!notifsData) return null;
          return (
            <div className="mb-4">
              {notifications.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/40">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  All clear
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((n) => {
                    const { Icon, cls } = NOTIF_ICON[n.type] ?? NOTIF_ICON.info;
                    return (
                      <div key={n.id} className={cn(
                        "flex items-start gap-2.5 rounded-md px-2.5 py-2 text-xs group bg-muted/30",
                        n.priority === "critical" && "bg-rose-500/5 border border-rose-500/20",
                      )}>
                        <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", cls)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium leading-tight">{n.title}</p>
                          <p className="text-muted-foreground/70 leading-tight">{n.message}</p>
                        </div>
                        <button
                          onClick={() => setDismissed((p) => new Set([...p, n.id]))}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-muted-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <Separator className="mt-3" />
            </div>
          );
        })()}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {agentsData.agents.map((agent) => {
            // ── Determine active state ──────────────────────────────────────
            const isWorking =
              (agent.name === "Jennie" && isMainActive) ||
              (agent.name === "Rosé"   && roseActive);

            // ── Find current task from kanban ───────────────────────────────
            const tasks = kanbanData?.tasks ?? [];
            const activeTask = tasks.find(t =>
              t.assignee === agent.name &&
              t.status === "inProgress" &&
              t.source === "manual" &&
              t.activeJobId
            );
            const taskLabel = activeTask
              ? (activeTask.title?.trim() || activeTask.description?.slice(0, 40) || "Task in progress")
              : null;

            // ── Status label & styling ──────────────────────────────────────
            let statusLabel: string;
            let statusColor: string;
            let statusDot: string;

            if (taskLabel) {
              statusLabel = "working";
              statusColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
              statusDot   = "bg-emerald-500 animate-pulse";
            } else if (isWorking && agent.name === "Jennie") {
              statusLabel = "in conversation";
              statusColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
              statusDot   = "bg-emerald-500 animate-pulse";
            } else if (isWorking) {
              statusLabel = "active";
              statusColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
              statusDot   = "bg-rose-500 animate-pulse";
            } else if (agent.name === "Lisa") {
              statusLabel = "monitoring";
              statusColor = "bg-primary/10 text-primary/80 border-primary/20";
              statusDot   = "bg-primary/60";
            } else {
              statusLabel = "standby";
              statusColor = "bg-muted text-muted-foreground/60 border-border";
              statusDot   = "bg-muted-foreground/30";
            }

            return (
              <div key={agent.id} className={cn(
                "rounded-lg border bg-muted/20 p-3 transition-all duration-300",
                taskLabel ? "border-emerald-500/25 shadow-sm shadow-emerald-500/10" :
                isWorking ? "border-primary/25" : "border-border/50"
              )}>
                <div className="flex flex-col items-center text-center">
                  <span className="text-2xl mb-2">{agent.emoji}</span>

                  <div className="flex items-center gap-1.5 mb-1 flex-wrap justify-center">
                    <span className="text-sm font-medium">{agent.name}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 ${statusColor}`}>
                      <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${statusDot}`} />
                      {statusLabel}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">{agent.role}</p>

                  {/* Model info */}
                  <div className="flex flex-col items-center gap-1 mb-2">
                    <span className="text-xs font-mono text-muted-foreground/70">{agent.modelShort}</span>
                    {agent.pricing && (
                      <Badge variant="outline" className={`text-[10px] ${tierColor[agent.pricing.tier] || ""}`}>
                        {agent.pricing.tier}
                      </Badge>
                    )}
                  </div>

                  {/* Live activity context */}
                  <div className="w-full border-t border-border/30 pt-2 mt-1 min-h-[32px] flex items-center justify-center">
                    {taskLabel ? (
                      <p className="text-[10px] text-emerald-500/90 leading-tight text-center font-medium">
                        🔨 {taskLabel.length > 38 ? taskLabel.slice(0, 37) + "…" : taskLabel}
                      </p>
                    ) : isWorking && agent.name === "Jennie" ? (
                      <p className="text-[10px] text-emerald-500/70 leading-tight text-center">
                        💬 Chatting with Tenichi
                        {statusData?.contextUsed ? (
                          <span className="block text-muted-foreground/50 mt-0.5">{statusData.contextUsed}% context used</span>
                        ) : null}
                      </p>
                    ) : isWorking ? (
                      <p className="text-[10px] text-primary/70 leading-tight text-center">⚡ Running…</p>
                    ) : agent.name === "Lisa" ? (
                      <p className="text-[10px] text-muted-foreground/50 leading-tight text-center">
                        👀 Watching guest messages
                        {statusData?.lastActivity && (
                          <span className="block mt-0.5">{formatRelativeTime(statusData.lastActivity)}</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/30 leading-tight text-center">No active tasks</p>
                    )}
                  </div>

                  {/* Agent files */}
                  <AgentFilesRow agentName={agent.name} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Cost summary */}
        {agentsData.costSummary && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Est. monthly cost</span>
              <div className="text-right">
                <span className="font-mono text-foreground">${agentsData.costSummary.estimatedMonthly}</span>
                <span className="ml-2 line-through text-muted-foreground">${agentsData.costSummary.opusBaseline}</span>
              </div>
            </div>
          </>
        )}


      </CardContent>
    </Card>
  );
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffSecs < 10) return "just now";
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}