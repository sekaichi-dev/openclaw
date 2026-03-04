"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Zap, Clock, Database, Cpu } from "lucide-react";
import { usePolling } from "@/hooks/use-polling";
import { useEffect, useState } from "react";

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

interface PerformanceMetric {
  label: string;
  value: string;
  trend?: "up" | "down" | "stable";
  color: string;
  icon: React.ElementType;
}

export function PerformanceMetricsCard() {
  const { data: statusData, loading } = usePolling<AgentStatus>("/api/status", 3000);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [previousData, setPreviousData] = useState<AgentStatus | null>(null);

  useEffect(() => {
    if (!statusData) return;

    // Calculate trends
    let contextTrend: "up" | "down" | "stable" = "stable";
    let sessionsTrend: "up" | "down" | "stable" = "stable";
    
    if (previousData) {
      if (statusData.contextUsed > previousData.contextUsed) contextTrend = "up";
      else if (statusData.contextUsed < previousData.contextUsed) contextTrend = "down";
      
      if (statusData.activeSessions > previousData.activeSessions) sessionsTrend = "up";
      else if (statusData.activeSessions < previousData.activeSessions) sessionsTrend = "down";
    }

    // Calculate performance metrics
    const contextEfficiency = Math.max(0, 100 - statusData.contextUsed);
    const sessionLoad = Math.min(100, (statusData.activeSessions / 5) * 100); // Assume 5 is high load
    const uptime = statusData.status === "active" ? "100%" : "0%";
    
    const newMetrics: PerformanceMetric[] = [
      {
        label: "Context Efficiency",
        value: `${contextEfficiency}%`,
        trend: contextTrend === "up" ? "down" : contextTrend === "down" ? "up" : "stable",
        color: contextEfficiency > 60 ? "text-emerald-500" : contextEfficiency > 30 ? "text-amber-500" : "text-rose-500",
        icon: Database,
      },
      {
        label: "Session Load", 
        value: `${sessionLoad.toFixed(0)}%`,
        trend: sessionsTrend,
        color: sessionLoad < 60 ? "text-emerald-500" : sessionLoad < 80 ? "text-amber-500" : "text-rose-500",
        icon: Cpu,
      },
      {
        label: "Agent Uptime",
        value: uptime,
        trend: "stable",
        color: statusData.status === "active" ? "text-emerald-500" : "text-muted-foreground",
        icon: Clock,
      },
      {
        label: "Response Speed",
        value: statusData.roseActive ? "Fast" : "Normal",
        trend: "stable", 
        color: statusData.roseActive ? "text-emerald-500" : "text-primary",
        icon: Zap,
      },
    ];

    setMetrics(newMetrics);
    setPreviousData(statusData);
  }, [statusData, previousData]);

  if (loading || !statusData) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted/50 rounded animate-pulse" />
                <div className="h-6 bg-muted/30 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
          Real-time
        </Badge>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const trendIcon = metric.trend === "up" ? "↗" : metric.trend === "down" ? "↙" : "→";
            const trendColor = metric.trend === "up" ? "text-emerald-500" : metric.trend === "down" ? "text-rose-500" : "text-muted-foreground";
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${metric.color}`} />
                    <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
                  </div>
                  <span className={`text-xs ${trendColor}`}>{trendIcon}</span>
                </div>
                <div className={`text-lg font-mono font-bold ${metric.color}`}>
                  {metric.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick status indicators */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">System Status</span>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full animate-pulse ${statusData.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className={statusData.status === "active" ? "text-emerald-500" : "text-amber-500"}>
                {statusData.status === "active" ? "Healthy" : "Standby"}
              </span>
            </div>
          </div>
          
          {statusData.contextUsed > 80 && (
            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
              ⚠️ High context usage - consider session cleanup
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}