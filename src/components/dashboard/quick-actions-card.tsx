"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Calendar, 
  Cloud, 
  Mail, 
  MessageSquare, 
  RefreshCw,
  Clock,
  Users
} from "lucide-react";

interface ActionResult {
  id: string;
  status: "loading" | "success" | "error";
  result?: string;
  timestamp: number;
}

export function QuickActionsCard({ className }: { className?: string }) {
  const [results, setResults] = useState<ActionResult[]>([]);
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const executeAction = async (actionId: string, endpoint: string, description: string) => {
    if (loading.has(actionId)) return;

    setLoading(prev => new Set(prev).add(actionId));
    
    // Add loading result
    const loadingResult: ActionResult = {
      id: actionId,
      status: "loading",
      result: description,
      timestamp: Date.now()
    };
    
    setResults(prev => [loadingResult, ...prev.filter(r => r.id !== actionId)].slice(0, 5));

    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      
      const successResult: ActionResult = {
        id: actionId,
        status: res.ok ? "success" : "error",
        result: res.ok ? (data.message || "Completed successfully") : (data.error || "Action failed"),
        timestamp: Date.now()
      };
      
      setResults(prev => [successResult, ...prev.filter(r => r.id !== actionId)].slice(0, 5));
    } catch (error) {
      const errorResult: ActionResult = {
        id: actionId,
        status: "error", 
        result: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now()
      };
      
      setResults(prev => [errorResult, ...prev.filter(r => r.id !== actionId)].slice(0, 5));
    } finally {
      setLoading(prev => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    }
  };

  const actions = [
    {
      id: "weather",
      label: "Tokyo Weather",
      icon: Cloud,
      description: "Get current Tokyo weather",
      endpoint: "/api/actions/weather",
      color: "text-blue-400"
    },
    {
      id: "calendar",
      label: "Today's Calendar",
      icon: Calendar,
      description: "Check today's schedule",
      endpoint: "/api/actions/calendar",
      color: "text-purple-400"
    },
    {
      id: "inbox",
      label: "Email Status",
      icon: Mail,
      description: "Check email inbox",
      endpoint: "/api/actions/inbox",
      color: "text-green-400"
    },
    {
      id: "lisa-check",
      label: "Lisa Health",
      icon: MessageSquare,
      description: "Check Lisa's status",
      endpoint: "/api/actions/lisa-health",
      color: "text-violet-400"
    },
    {
      id: "team-status",
      label: "Team Status",
      icon: Users,
      description: "All agent status check",
      endpoint: "/api/actions/team-status",
      color: "text-cyan-400"
    },
    {
      id: "morning-brief",
      label: "Trigger Brief",
      icon: Clock,
      description: "Generate morning brief",
      endpoint: "/api/actions/morning-brief",
      color: "text-orange-400"
    }
  ];

  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return "just now";
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </div>
        {results.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs"
            onClick={() => setResults([])}
          >
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {actions.map((action) => {
            const isLoading = loading.has(action.id);
            const Icon = action.icon;
            
            return (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-muted/50"
                onClick={() => executeAction(action.id, action.endpoint, action.description)}
                disabled={isLoading}
              >
                <div className="flex items-center gap-1.5">
                  {isLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <Icon className={`h-3.5 w-3.5 ${action.color}`} />
                  )}
                  <span className="text-xs font-medium">{action.label}</span>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Recent results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">Recent Results</div>
            {results.map((result) => (
              <div
                key={`${result.id}-${result.timestamp}`}
                className="flex items-start gap-2 p-2 rounded-md bg-muted/20 border border-border/30"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      result.status === "success" 
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : result.status === "error"
                        ? "bg-red-500/20 text-red-400 border-red-500/30" 
                        : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    }`}
                  >
                    {result.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {result.result}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimeAgo(result.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}