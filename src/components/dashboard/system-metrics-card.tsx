"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePolling } from "@/hooks/use-polling";
import { 
  TrendingUp, 
  Cpu, 
  MemoryStick, 
  Clock, 
  Zap,
  CheckCircle2,
  AlertTriangle,
  Activity
} from "lucide-react";

interface SystemMetrics {
  uptime: string;
  autonomyScore: number;
  tasksCompleted24h: number;
  avgResponseTime: number;
  activeMonitors: number;
  systemLoad: number;
  memoryUsage: number;
  healthStatus: "excellent" | "good" | "warning" | "critical";
  lastOptimization: string;
}

export function SystemMetricsCard({ className }: { className?: string }) {
  const { data: metrics, loading } = usePolling<SystemMetrics>("/api/system-metrics", 15000);

  const healthColor = {
    excellent: "text-emerald-400",
    good: "text-blue-400", 
    warning: "text-yellow-400",
    critical: "text-red-400"
  };

  const healthIcon = {
    excellent: CheckCircle2,
    good: Activity,
    warning: AlertTriangle, 
    critical: AlertTriangle
  };

  if (loading || !metrics) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">System Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const HealthIcon = healthIcon[metrics.healthStatus];
  const autonomyGrade = metrics.autonomyScore >= 95 ? "A+" :
                       metrics.autonomyScore >= 90 ? "A" :
                       metrics.autonomyScore >= 85 ? "B+" :
                       metrics.autonomyScore >= 80 ? "B" : "C";

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">System Metrics</CardTitle>
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              24/7 Auto
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <HealthIcon className={`h-4 w-4 ${healthColor[metrics.healthStatus]}`} />
            <span className={`text-sm font-medium ${healthColor[metrics.healthStatus]}`}>
              {metrics.healthStatus.charAt(0).toUpperCase() + metrics.healthStatus.slice(1)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Autonomy Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Autonomy Score</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold">
                {autonomyGrade}
              </Badge>
              <span className="text-sm text-muted-foreground">{metrics.autonomyScore}%</span>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${metrics.autonomyScore}%` }}
            />
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs text-muted-foreground">Tasks (24h)</span>
            </div>
            <span className="text-lg font-bold">{metrics.tasksCompleted24h}</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-muted-foreground">Avg Response</span>
            </div>
            <span className="text-lg font-bold">{metrics.avgResponseTime}ms</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Active Monitors</span>
            </div>
            <span className="text-lg font-bold">{metrics.activeMonitors}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs text-muted-foreground">Uptime</span>
            </div>
            <span className="text-sm font-medium">{metrics.uptime}</span>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="space-y-3 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">System Load</span>
            </div>
            <span className="text-xs font-mono">{metrics.systemLoad}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                metrics.systemLoad > 80 ? 'bg-red-400' : 
                metrics.systemLoad > 60 ? 'bg-yellow-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${metrics.systemLoad}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MemoryStick className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Memory Usage</span>
            </div>
            <span className="text-xs font-mono">{metrics.memoryUsage}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                metrics.memoryUsage > 85 ? 'bg-red-400' : 
                metrics.memoryUsage > 70 ? 'bg-yellow-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${metrics.memoryUsage}%` }}
            />
          </div>
        </div>

        {/* Last Optimization */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
          <span>Last optimization:</span>
          <span>{metrics.lastOptimization}</span>
        </div>
      </CardContent>
    </Card>
  );
}