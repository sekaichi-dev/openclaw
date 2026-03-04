"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  MessageSquare, 
  RefreshCw, 
  Download,
  Calendar,
  GitBranch,
  AlertCircle,
  Coffee,
  Clock,
  ExternalLink
} from "lucide-react";
import { useState, useCallback } from "react";
import { usePolling } from "@/hooks/use-polling";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
  action: () => void;
  disabled?: boolean;
  badge?: string;
  external?: boolean;
}

interface AgentStatus {
  agent: string;
  status: string;
  activeSessions: number;
  roseActive?: boolean;
}

export function QuickActionsCard() {
  const { data: statusData } = usePolling<AgentStatus>("/api/status", 5000);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = useCallback(async (actionId: string, actionFn: () => void) => {
    setLoading(actionId);
    try {
      await actionFn();
    } finally {
      // Simulate action completion
      setTimeout(() => setLoading(null), 1000);
    }
  }, []);

  const quickActions: QuickAction[] = [
    {
      id: "check-messages", 
      label: "Check Messages",
      icon: MessageSquare,
      color: "text-blue-500",
      description: "Review unread notifications & messages",
      action: () => {
        // This would integrate with actual messaging systems
        console.log("Checking messages...");
        window.open("/activity", "_blank");
      },
      badge: "3",
      external: true,
    },
    {
      id: "refresh-agents",
      label: "Refresh Status",
      icon: RefreshCw,
      color: "text-emerald-500", 
      description: "Update all agent statuses",
      action: () => {
        // This would trigger a status refresh
        console.log("Refreshing agent statuses...");
        window.location.reload();
      },
    },
    {
      id: "export-logs",
      label: "Export Logs", 
      icon: Download,
      color: "text-purple-500",
      description: "Download activity logs for analysis",
      action: () => {
        // This would export current logs
        console.log("Exporting logs...");
        // Simulate file download
        const link = document.createElement('a');
        link.href = "data:text/plain,Activity logs exported at " + new Date().toISOString();
        link.download = "mission-control-logs.txt";
        link.click();
      },
    },
    {
      id: "schedule-task",
      label: "Schedule Task",
      icon: Calendar, 
      color: "text-amber-500",
      description: "Create a new scheduled task",
      action: () => {
        window.open("/tasks", "_blank");
      },
      external: true,
    },
    {
      id: "check-deployments",
      label: "Deployments",
      icon: GitBranch,
      color: "text-cyan-500", 
      description: "View recent deployments & updates",
      action: () => {
        window.open("/changelog", "_blank");
      },
      external: true,
    },
    {
      id: "system-health",
      label: "Health Check",
      icon: AlertCircle,
      color: statusData?.status === "active" ? "text-emerald-500" : "text-amber-500",
      description: "Run system diagnostics",
      action: () => {
        console.log("Running health check...");
        // This would trigger actual health check
        alert("System status: " + (statusData?.status === "active" ? "Healthy ✅" : "Standby ⚠️"));
      },
    },
    {
      id: "coffee-break",
      label: "Coffee Break", 
      icon: Coffee,
      color: "text-amber-600",
      description: "15min break timer",
      action: () => {
        console.log("Starting coffee break timer...");
        const endTime = new Date(Date.now() + 15 * 60000);
        alert(`Coffee break started! ☕\nBack at ${endTime.toLocaleTimeString()}`);
      },
    },
    {
      id: "pomodoro",
      label: "Focus Session",
      icon: Clock,
      color: "text-rose-500",
      description: "Start 25min focus timer", 
      action: () => {
        console.log("Starting pomodoro timer...");
        const endTime = new Date(Date.now() + 25 * 60000);
        alert(`Focus session started! 🍅\nBreak at ${endTime.toLocaleTimeString()}`);
      },
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </div>
        <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
          {quickActions.length} actions
        </Badge>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isLoading = loading === action.id;
            
            return (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                className="h-auto flex-col items-start gap-1 p-3 relative"
                onClick={() => handleAction(action.id, action.action)}
                disabled={action.disabled || isLoading}
                title={action.description}
              >
                <div className="flex items-center justify-between w-full">
                  <Icon className={`h-4 w-4 ${action.color} ${isLoading ? 'animate-spin' : ''}`} />
                  <div className="flex items-center gap-1">
                    {action.badge && (
                      <Badge variant="secondary" className="h-4 text-[10px] px-1 bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        {action.badge}
                      </Badge>
                    )}
                    {action.external && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="w-full text-left">
                  <div className="text-xs font-medium truncate">{action.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {action.description}
                  </div>
                </div>
                {isLoading && (
                  <div className="absolute inset-0 bg-background/50 rounded flex items-center justify-center">
                    <div className="text-xs text-muted-foreground">Processing...</div>
                  </div>
                )}
              </Button>
            );
          })}
        </div>

        {/* Quick stats */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Active Sessions</span>
            <span className="font-mono text-foreground">
              {statusData?.activeSessions || 0}
            </span>
          </div>
          {statusData?.roseActive && (
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Coding Agent</span>
              <Badge variant="outline" className="h-4 text-[10px] px-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse mr-1" />
                Active
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}