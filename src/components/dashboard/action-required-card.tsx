"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePolling } from "@/hooks/use-polling";
import { AlertTriangle, GitPullRequest, XCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  priority: "high" | "medium" | "low";
}

const typeIcons: Record<string, typeof AlertTriangle> = {
  pairing_request: GitPullRequest,
  failed_cron: XCircle,
  pending_approval: Shield,
};

const priorityColors: Record<string, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function ActionRequiredCard({ className }: { className?: string }) {
  const { data: actions, loading } = usePolling<ActionItem[]>("/api/actions");

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Action Required</CardTitle>
          {actions && actions.length > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
              {actions.length}
            </Badge>
          )}
        </div>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : !actions || actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-emerald-500/10 p-3 mb-2">
              <AlertTriangle className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              No actions required. All clear!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => {
              const Icon = typeIcons[action.type] || AlertTriangle;
              return (
                <div
                  key={action.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-tight">
                      {action.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          priorityColors[action.priority]
                        )}
                      >
                        {action.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(action.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
