"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, TrendingDown } from "lucide-react";
import { usePolling } from "@/hooks/use-polling";

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

export function AgentModelsCard({ className }: { className?: string }) {
  const { data, loading } = usePolling<AgentsData>("/api/agents", 30000);

  const tierColor: Record<string, string> = {
    Frontier: "bg-red-500/20 text-red-400 border-red-500/30",
    Standard: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Fast: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };

  const agentColor: Record<string, string> = {
    Jennie: "text-emerald-400",
    Lisa: "text-violet-400",
    Rosé: "text-pink-400",
  };

  if (loading || !data) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Agent Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Agent Models</CardTitle>
        </div>
        {data.costSummary && data.costSummary.savingsPercent > 0 && (
          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <TrendingDown className="mr-1 h-3 w-3" />
            {data.costSummary.savingsPercent}% vs all-Opus
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg shrink-0">{agent.emoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${agentColor[agent.name] || "text-foreground"}`}>
                      {agent.name}
                    </span>
                    {agent.status === "idle" && (
                      <span className="text-[10px] text-muted-foreground">(on-demand)</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right mr-2">
                  <p className="text-sm font-mono">{agent.modelShort}</p>
                  {agent.pricing && (
                    <p className="text-[10px] text-muted-foreground">
                      ${agent.pricing.input}/${agent.pricing.output} per 1M tok
                    </p>
                  )}
                </div>
                {agent.pricing && (
                  <Badge variant="outline" className={`text-[10px] ${tierColor[agent.pricing.tier] || ""}`}>
                    {agent.pricing.tier}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {data.costSummary && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-border/50 px-3 py-2 text-xs text-muted-foreground">
            <span>Est. monthly (rough)</span>
            <div className="text-right">
              <span className="font-mono text-foreground">${data.costSummary.estimatedMonthly}</span>
              <span className="ml-2 line-through">${data.costSummary.opusBaseline}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
