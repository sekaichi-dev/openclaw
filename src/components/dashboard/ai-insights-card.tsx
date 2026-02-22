"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/use-polling";
import { 
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Brain,
  Target,
  ChevronRight,
  X
} from "lucide-react";

interface AIInsight {
  id: string;
  type: "recommendation" | "alert" | "optimization" | "trend";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  action?: {
    label: string;
    endpoint?: string;
    dangerous?: boolean;
  };
  timestamp: string;
  category: "performance" | "cost" | "automation" | "maintenance" | "security";
  dismissed?: boolean;
  impact?: {
    score: number;
    metric: string;
  };
}

const INSIGHT_ICONS = {
  recommendation: Lightbulb,
  alert: AlertTriangle,
  optimization: TrendingUp,
  trend: Target,
};

const PRIORITY_COLORS = {
  critical: "text-red-400 border-red-500/30 bg-red-500/10",
  high: "text-orange-400 border-orange-500/30 bg-orange-500/10", 
  medium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  low: "text-blue-400 border-blue-500/30 bg-blue-500/10",
};

const CATEGORY_COLORS = {
  performance: "text-emerald-400",
  cost: "text-yellow-400",
  automation: "text-blue-400", 
  maintenance: "text-violet-400",
  security: "text-red-400",
};

export function AIInsightsCard({ className }: { className?: string }) {
  const { data: insights, loading } = usePolling<AIInsight[]>("/api/ai-insights", 45000);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleInsights = (insights || []).filter(insight => 
    !dismissedIds.has(insight.id) && !insight.dismissed
  );

  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const sortedInsights = visibleInsights.sort((a, b) => 
    priorityOrder[b.priority] - priorityOrder[a.priority]
  );

  const criticalCount = sortedInsights.filter(i => i.priority === "critical").length;
  const highCount = sortedInsights.filter(i => i.priority === "high").length;

  const dismissInsight = (id: string) => {
    setDismissedIds(prev => new Set(prev.add(id)));
  };

  const executeAction = async (insight: AIInsight) => {
    if (!insight.action) return;
    
    if (insight.action.dangerous) {
      if (!confirm(`This will ${insight.action.label.toLowerCase()}. Continue?`)) {
        return;
      }
    }

    try {
      if (insight.action.endpoint) {
        const response = await fetch(insight.action.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ insightId: insight.id })
        });
        
        if (response.ok) {
          dismissInsight(insight.id);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } else {
        // Auto-dismiss action-less insights when clicked
        dismissInsight(insight.id);
      }
    } catch (error) {
      console.error('Failed to execute insight action:', error);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
          </div>
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

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            {sortedInsights.length > 0 && (
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {sortedInsights.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="outline" className={PRIORITY_COLORS.critical}>
                {criticalCount} Critical
              </Badge>
            )}
            {highCount > 0 && (
              <Badge variant="outline" className={PRIORITY_COLORS.high}>
                {highCount} High
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedInsights.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-center">
            <div className="space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="text-sm text-muted-foreground">All systems optimal</p>
              <p className="text-xs text-muted-foreground">No insights at this time</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {sortedInsights.slice(0, 6).map((insight) => {
              const Icon = INSIGHT_ICONS[insight.type];
              const CategoryIcon = CATEGORY_COLORS[insight.category];
              
              return (
                <div
                  key={insight.id}
                  className={`rounded-lg border p-3 transition-all hover:bg-muted/30 ${
                    PRIORITY_COLORS[insight.priority]
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <Icon className={`h-4 w-4 mt-0.5 ${
                        insight.priority === "critical" ? "text-red-400" :
                        insight.priority === "high" ? "text-orange-400" :
                        insight.priority === "medium" ? "text-yellow-400" : "text-blue-400"
                      }`} />
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium truncate">{insight.title}</h4>
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {insight.category}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground leading-tight">
                          {insight.description}
                        </p>
                        
                        {insight.impact && (
                          <div className="flex items-center gap-2 text-xs">
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                            <span className="text-muted-foreground">
                              Impact: {insight.impact.score}% {insight.impact.metric}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(insight.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {insight.action && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => executeAction(insight)}
                        >
                          {insight.action.label}
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => dismissInsight(insight.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {sortedInsights.length > 6 && (
              <div className="text-center pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  +{sortedInsights.length - 6} more insights available
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* AI Learning Status */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
          <Zap className="h-3 w-3" />
          <span>AI continuously learning • Next analysis in 45s</span>
        </div>
      </CardContent>
    </Card>
  );
}