"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/use-polling";
import { 
  Network,
  MessageCircle,
  Zap,
  Users,
  Activity,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Workflow,
  Bot
} from "lucide-react";

interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: "task_delegation" | "status_update" | "coordination" | "escalation" | "heartbeat";
  content: string;
  timestamp: number;
  priority: "low" | "medium" | "high" | "critical";
  status: "sent" | "acknowledged" | "completed" | "failed";
}

interface AgentNetworkData {
  agents: {
    id: string;
    name: string;
    status: "active" | "idle" | "busy" | "offline";
    role: string;
    currentTask?: string;
    messagesReceived: number;
    messagesSent: number;
    collaborationScore: number;
    load: number;
  }[];
  recentMessages: AgentMessage[];
  networkHealth: number;
  totalMessages24h: number;
  activeCollaborations: number;
  autonomyLevel: number;
}

const AGENT_COLORS = {
  jennie: {
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/50",
    text: "text-emerald-400",
    dot: "bg-emerald-400"
  },
  lisa: {
    bg: "bg-purple-500/20", 
    border: "border-purple-500/50",
    text: "text-purple-400",
    dot: "bg-purple-400"
  },
  rose: {
    bg: "bg-pink-500/20",
    border: "border-pink-500/50", 
    text: "text-pink-400",
    dot: "bg-pink-400"
  }
};

const MESSAGE_TYPE_ICONS = {
  task_delegation: Workflow,
  status_update: CheckCircle2,
  coordination: Users,
  escalation: AlertCircle,
  heartbeat: Activity
};

const MESSAGE_TYPE_COLORS = {
  task_delegation: "text-blue-400",
  status_update: "text-green-400", 
  coordination: "text-yellow-400",
  escalation: "text-red-400",
  heartbeat: "text-gray-400"
};

export function AgentNetworkCard() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { data: networkData, loading } = usePolling<AgentNetworkData>(
    "/api/agent-network", 
    15000, // Base refresh every 15 seconds for real-time feel
    undefined,
    {
      priority: "high",
      adaptiveInterval: true,
      retryCount: 5
    }
  );

  // Draw network visualization on canvas
  useEffect(() => {
    if (!networkData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    const agents = networkData.agents.filter(a => a.status !== 'offline');
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;

    // Draw connections between active agents
    agents.forEach((agent, i) => {
      agents.forEach((other, j) => {
        if (i >= j) return; // Avoid duplicate lines
        
        const angle1 = (i / agents.length) * 2 * Math.PI;
        const angle2 = (j / agents.length) * 2 * Math.PI;
        const x1 = centerX + Math.cos(angle1) * radius;
        const y1 = centerY + Math.sin(angle1) * radius;
        const x2 = centerX + Math.cos(angle2) * radius;
        const y2 = centerY + Math.sin(angle2) * radius;

        // Connection strength based on recent messages
        const recentMessages = networkData.recentMessages.filter(
          m => (m.from === agent.id && m.to === other.id) || 
               (m.from === other.id && m.to === agent.id)
        );
        const strength = Math.min(recentMessages.length / 5, 1);
        
        if (strength > 0.1) {
          ctx.strokeStyle = `rgba(100, 116, 139, ${strength * 0.6})`;
          ctx.lineWidth = strength * 3;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      });
    });

    // Draw agent nodes
    agents.forEach((agent, i) => {
      const angle = (i / agents.length) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const nodeRadius = 20 + (agent.load * 0.2); // Size based on load

      // Agent circle
      const color = AGENT_COLORS[agent.id as keyof typeof AGENT_COLORS];
      ctx.fillStyle = agent.status === 'active' ? 
        (color?.dot || '#10b981') : 
        'rgba(156, 163, 175, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Status ring
      if (agent.status === 'active') {
        ctx.strokeStyle = color?.dot || '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius + 4, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Agent label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(agent.name, x, y - nodeRadius - 10);
    });

  }, [networkData]);

  if (loading || !networkData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Agent Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-32 bg-muted rounded"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-muted rounded flex-1"></div>
              <div className="h-8 bg-muted rounded flex-1"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Agent Network
        </CardTitle>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {networkData.totalMessages24h} messages today
          </Badge>
          <Badge 
            variant={networkData.networkHealth > 85 ? "default" : "destructive"}
            className="text-xs"
          >
            {networkData.networkHealth}% health
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Network Visualization */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-32 rounded-lg bg-muted/20"
            style={{ height: '128px' }}
          />
          
          {/* Network Stats Overlay */}
          <div className="absolute top-2 right-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {networkData.activeCollaborations} active
            </div>
          </div>
        </div>

        {/* Agent Status Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {networkData.agents.map(agent => {
            const config = AGENT_COLORS[agent.id as keyof typeof AGENT_COLORS];
            return (
              <div
                key={agent.id}
                className={`p-2 rounded cursor-pointer transition-all ${
                  selectedAgent === agent.id 
                    ? config?.bg + " " + config?.border + " border"
                    : "bg-muted/50 hover:bg-muted"
                }`}
                onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      agent.status === 'active' 
                        ? config?.dot || 'bg-green-400'
                        : 'bg-gray-400'
                    }`}
                  />
                  <span className="font-medium text-sm">{agent.name}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {agent.role} • Load: {agent.load}%
                </div>
                {agent.currentTask && (
                  <div className="text-xs text-blue-400 mt-1">
                    {agent.currentTask}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Recent Messages */}
        <div className="mt-4 pt-3 border-t">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Recent Communications
          </h4>
          <div className="space-y-2 max-h-24 overflow-y-auto">
            {networkData.recentMessages.slice(0, 3).map(message => {
              const Icon = MESSAGE_TYPE_ICONS[message.type];
              const colorClass = MESSAGE_TYPE_COLORS[message.type];
              return (
                <div key={message.id} className="flex items-center gap-2 text-xs p-2 bg-muted/30 rounded">
                  <Icon className={`h-3 w-3 ${colorClass}`} />
                  <span className="font-medium">{message.from}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{message.to}</span>
                  <span className="text-muted-foreground flex-1 truncate">
                    {message.content}
                  </span>
                  <Badge 
                    variant={message.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs px-1"
                  >
                    {message.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Network Health Indicator */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Autonomy Level</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-muted rounded-full">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${networkData.autonomyLevel}%` }}
                />
              </div>
              <span className="font-bold text-emerald-400">
                {networkData.autonomyLevel}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}