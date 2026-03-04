"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, TrendingDown, Activity, Clock, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { usePolling } from "@/hooks/use-polling";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
            // Determine agent status
            let agentStatus = "idle";
            let statusColor = "bg-muted-foreground/20 text-muted-foreground";
            let statusDot = "bg-muted-foreground";
            
            if (agent.name === "Jennie" && isMainActive) {
              agentStatus = "active";
              statusColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
              statusDot = "bg-emerald-500 animate-pulse";
            } else if (agent.name === "Lisa") {
              agentStatus = "standby";
              statusColor = "bg-primary/10 text-primary/80 border-primary/20";
              statusDot = "bg-primary/60";
            } else if (agent.name === "Jisoo") {
              agentStatus = "standby";
              statusColor = "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
              statusDot = "bg-cyan-500/60";
            } else if (agent.name === "Rosé" && roseActive) {
              agentStatus = "active";
              statusColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
              statusDot = "bg-rose-500 animate-pulse";
            } else if (agent.name === "Rosé") {
              agentStatus = "available";
              statusColor = "bg-muted text-muted-foreground border-border";
              statusDot = "bg-muted-foreground/50";
            }

            const isMainAgent = agent.name === "Jennie";

            return (
              <div key={agent.id} className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <div className="flex flex-col items-center text-center">
                  <span className="text-2xl mb-2">{agent.emoji}</span>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-medium ${agentColor[agent.name] || "text-foreground"}`}>
                      {agent.name}
                    </span>
                    <Badge variant="outline" className={`text-xs ${statusColor}`}>
                      <span className={`mr-1 inline-block h-2 w-2 rounded-full ${statusDot}`} />
                      {agentStatus}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">{agent.role}</p>
                  
                  {/* Model info */}
                  <div className="flex flex-col items-center gap-1 mb-2">
                    <span className="text-xs font-mono text-muted-foreground">{agent.modelShort}</span>
                    {agent.pricing && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${tierColor[agent.pricing.tier] || ""}`}>
                          {agent.pricing.tier}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          ${agent.pricing.input}/${agent.pricing.output}/1M
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Main agent gets extra status info */}
                  {isMainAgent && statusData && (
                    <div className="flex flex-col gap-1 mt-2 text-[11px] text-muted-foreground border-t border-border/30 pt-2">
                      <div className="flex items-center justify-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span>{statusData.activeSessions} sessions</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{statusData.contextUsed}% context</span>
                      </div>
                      {statusData.lastActivity && (
                        <span className="text-center">{formatRelativeTime(statusData.lastActivity)}</span>
                      )}
                    </div>
                  )}
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