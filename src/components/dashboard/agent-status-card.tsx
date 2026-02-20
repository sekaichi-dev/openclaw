"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePolling } from "@/hooks/use-polling";
import { Bot, Clock, Cpu, Zap, Server, Activity } from "lucide-react";

interface AgentStatus {
  agent: string;
  status: string;
  model: string;
  lastActivity: string | null;
  host: string | null;
  platform: string | null;
  version: string | null;
  activeSessions: number;
  contextUsed: number;
  totalTokens: number;
  contextTokens: number;
}

export function AgentStatusCard() {
  const { data, loading } = usePolling<AgentStatus>("/api/status", 10000);

  const isActive = data?.status === "active";
  const statusColor = isActive
    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    : "bg-amber-500/20 text-amber-400 border-amber-500/30";
  const statusLabel = isActive ? "Active" : "Standby";
  const statusDot = isActive ? "bg-emerald-400" : "bg-amber-400";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Agent Status</CardTitle>
        <Bot className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold">{data?.agent || "Jennie"}</h3>
              <Badge variant="outline" className={statusColor}>
                <span
                  className={`mr-1.5 inline-block h-2 w-2 rounded-full ${statusDot} ${isActive ? "animate-pulse" : ""}`}
                />
                {statusLabel}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cpu className="h-3.5 w-3.5" />
                <span>Model:</span>
                <span className="text-foreground font-mono text-xs">
                  {data?.model || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                <span>Last activity:</span>
                <span className="text-foreground">
                  {data?.lastActivity
                    ? formatRelativeTime(data.lastActivity)
                    : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                <span>Sessions:</span>
                <span className="text-foreground">
                  {data?.activeSessions ?? "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Context:</span>
                <span className="text-foreground">
                  {data?.contextUsed != null
                    ? `${data.contextUsed}% used (${formatTokens(data.totalTokens)} / ${formatTokens(data.contextTokens)})`
                    : "—"}
                </span>
              </div>
              {data?.host && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Server className="h-3.5 w-3.5" />
                  <span>Host:</span>
                  <span className="text-foreground text-xs">
                    {data.host}
                    {data.version ? ` • v${data.version}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffSecs < 10) return "Just now";
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
