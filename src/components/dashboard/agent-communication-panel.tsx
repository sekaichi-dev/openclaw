"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/use-polling";
import { 
  MessageSquare,
  Send,
  Clock,
  User,
  Bot,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
  RefreshCw,
  Zap,
  Activity
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: "task_delegation" | "status_update" | "coordination" | "escalation" | "heartbeat";
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "acknowledged" | "failed";
  priority: "low" | "medium" | "high" | "critical";
  context?: {
    sessionId?: string;
    taskId?: string;
    businessUnit?: string;
  };
}

interface CommunicationStats {
  totalMessages24h: number;
  successRate: number;
  avgResponseTime: number;
  activeConversations: number;
  criticalMessages: number;
  collaborationScore: number;
}

const MESSAGE_TYPE_COLORS = {
  task_delegation: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  status_update: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  coordination: "bg-purple-500/10 border-purple-500/30 text-purple-400", 
  escalation: "bg-red-500/10 border-red-500/30 text-red-400",
  heartbeat: "bg-slate-500/10 border-slate-500/30 text-slate-400"
};

const PRIORITY_INDICATORS = {
  critical: "🔴",
  high: "🟠", 
  medium: "🟡",
  low: "🟢"
};

export function AgentCommunicationPanel() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data: messages, loading: messagesLoading } = usePolling<AgentMessage[]>(
    "/api/agent-messages", 
    autoRefresh ? 10000 : null, // 10-second refresh when auto-refresh is on
    undefined,
    { priority: "high", adaptiveInterval: true }
  );

  const { data: stats, loading: statsLoading } = usePolling<CommunicationStats>(
    "/api/communication-stats",
    30000, // 30-second refresh for stats
    undefined,
    { priority: "medium" }
  );

  const filteredMessages = (messages || []).filter(msg => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "critical") return msg.priority === "critical";
    if (selectedFilter === "failed") return msg.status === "failed";
    return msg.type === selectedFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <Clock className="h-3 w-3 text-yellow-400" />;
      case "delivered": return <CheckCircle2 className="h-3 w-3 text-blue-400" />;
      case "acknowledged": return <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
      case "failed": return <AlertCircle className="h-3 w-3 text-red-400" />;
      default: return <Clock className="h-3 w-3 text-slate-400" />;
    }
  };

  const getAgentColor = (agentName: string) => {
    switch (agentName.toLowerCase()) {
      case "jennie": return "text-emerald-400";
      case "lisa": return "text-purple-400";
      case "rosé": return "text-pink-400";
      default: return "text-blue-400";
    }
  };

  if (messagesLoading && statsLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Agent Communication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>Agent Communication</CardTitle>
            {stats && (
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                {stats.successRate}% success
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="h-7"
            >
              <RefreshCw className={`h-3 w-3 ${autoRefresh ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Communication Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="text-lg font-bold text-blue-400">{stats.totalMessages24h}</div>
              <div className="text-xs text-muted-foreground">Messages (24h)</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-lg font-bold text-emerald-400">{stats.avgResponseTime}s</div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <div className="text-lg font-bold text-purple-400">{stats.activeConversations}</div>
              <div className="text-xs text-muted-foreground">Active Chats</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-lg font-bold text-amber-400">{stats.collaborationScore}%</div>
              <div className="text-xs text-muted-foreground">Collaboration</div>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "all", label: "All", icon: Activity },
            { id: "critical", label: "Critical", icon: AlertCircle },
            { id: "task_delegation", label: "Tasks", icon: Send },
            { id: "status_update", label: "Status", icon: CheckCircle2 },
            { id: "failed", label: "Failed", icon: AlertCircle }
          ].map(filter => (
            <Button
              key={filter.id}
              variant={selectedFilter === filter.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedFilter(filter.id)}
              className="h-7 text-xs whitespace-nowrap"
            >
              <filter.icon className="h-3 w-3 mr-1" />
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Messages List */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No messages in this view</p>
              </div>
            ) : (
              filteredMessages.slice(0, 20).map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg border transition-all hover:bg-muted/30 ${
                    MESSAGE_TYPE_COLORS[message.type]
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${getAgentColor(message.from)}`}>
                          {message.from}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className={`text-sm ${getAgentColor(message.to)}`}>
                          {message.to}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {message.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs">
                          {PRIORITY_INDICATORS[message.priority]}
                        </span>
                      </div>
                      
                      <p className="text-sm text-foreground/90 mb-2 leading-tight">
                        {message.content}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(message.status)}
                          <span>{message.status}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {message.context?.businessUnit && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {message.context.businessUnit}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Agent Network Health */}
        {stats && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium">Network Health</span>
                <Badge 
                  variant="outline" 
                  className={`${
                    stats.collaborationScore >= 90 
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : stats.collaborationScore >= 70
                      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}
                >
                  {stats.collaborationScore >= 90 ? "Excellent" : 
                   stats.collaborationScore >= 70 ? "Good" : "Needs Attention"}
                </Badge>
              </div>
              {stats.criticalMessages > 0 && (
                <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                  {stats.criticalMessages} Critical
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}