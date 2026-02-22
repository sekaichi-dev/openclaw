"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePolling } from "@/hooks/use-polling";
import { 
  BarChart3,
  Clock,
  MousePointer,
  Eye,
  TrendingUp,
  Zap,
  Target
} from "lucide-react";

interface UsageAnalytics {
  totalSessions: number;
  avgSessionDuration: string;
  mostUsedFeatures: Array<{
    name: string;
    usage: number;
    trend: "up" | "down" | "stable";
  }>;
  timeDistribution: Array<{
    hour: number;
    activity: number;
  }>;
  autonomyEfficiency: {
    tasksAutomated: number;
    humanInterventions: number;
    successRate: number;
  };
  lastUpdated: string;
}

export function UsageAnalyticsCard({ className }: { className?: string }) {
  const { data: analytics, loading } = usePolling<UsageAnalytics>("/api/usage-analytics", 60000);

  if (loading || !analytics) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Usage Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const peakHour = analytics.timeDistribution.reduce((max, curr) => 
    curr.activity > max.activity ? curr : max
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Usage Analytics</CardTitle>
            <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30">
              24h
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Updated {new Date(analytics.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-muted-foreground">Sessions</span>
            </div>
            <div className="text-lg font-bold">{analytics.totalSessions}</div>
            <div className="text-xs text-muted-foreground">
              Avg: {analytics.avgSessionDuration}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Success Rate</span>
            </div>
            <div className="text-lg font-bold">{analytics.autonomyEfficiency.successRate}%</div>
            <div className="text-xs text-muted-foreground">
              Autonomy level
            </div>
          </div>
        </div>

        {/* Automation Efficiency */}
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Automation Efficiency</span>
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              Excellent
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tasks Automated</span>
              <span className="font-medium">{analytics.autonomyEfficiency.tasksAutomated}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Human Interventions</span>
              <span className="font-medium">{analytics.autonomyEfficiency.humanInterventions}</span>
            </div>
          </div>
          
          <div className="h-2 bg-muted rounded-full mt-2">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full"
              style={{ 
                width: `${(analytics.autonomyEfficiency.tasksAutomated / 
                  (analytics.autonomyEfficiency.tasksAutomated + analytics.autonomyEfficiency.humanInterventions)) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Most Used Features */}
        <div className="space-y-3 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <MousePointer className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Popular Features</span>
          </div>
          
          <div className="space-y-2">
            {analytics.mostUsedFeatures.slice(0, 3).map((feature, idx) => (
              <div key={feature.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">#{idx + 1}</span>
                  <span className="text-xs">{feature.name}</span>
                  {feature.trend === "up" && (
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{feature.usage}</span>
                  <div className="w-12 h-1.5 bg-muted rounded-full">
                    <div 
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${Math.min((feature.usage / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Activity */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Peak activity</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-400" />
              <span className="font-medium">
                {peakHour.hour}:00 ({peakHour.activity} actions)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}