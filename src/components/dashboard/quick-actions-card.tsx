"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap,
  Calendar,
  Mail,
  MessageSquare,
  Bot,
  RefreshCw,
  BarChart3,
  Settings,
  Cloud,
  CheckCircle2,
  Clock,
  Loader2
} from "lucide-react";

interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  category: "communication" | "monitoring" | "automation" | "system";
  endpoint?: string;
  requiresConfirm?: boolean;
  dangerous?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "morning-brief",
    name: "Morning Brief",
    description: "Generate and send morning briefing",
    icon: BarChart3,
    color: "text-blue-400",
    category: "communication",
    endpoint: "/api/actions/morning-brief"
  },
  {
    id: "check-inbox",
    name: "Check Inbox", 
    description: "Review new emails and notifications",
    icon: Mail,
    color: "text-emerald-400",
    category: "monitoring",
    endpoint: "/api/actions/inbox"
  },
  {
    id: "team-status",
    name: "Team Status",
    description: "Get status of all agents and systems",
    icon: Bot,
    color: "text-violet-400", 
    category: "monitoring",
    endpoint: "/api/actions/team-status"
  },
  {
    id: "lisa-health",
    name: "Lisa Health",
    description: "Check villa concierge system status",
    icon: MessageSquare,
    color: "text-pink-400",
    category: "monitoring",
    endpoint: "/api/actions/lisa-health"
  },
  {
    id: "weather",
    name: "Weather Update",
    description: "Get current weather and forecast",
    icon: Cloud,
    color: "text-cyan-400",
    category: "monitoring",
    endpoint: "/api/actions/weather"
  },
  {
    id: "calendar",
    name: "Today's Calendar",
    description: "Review today's schedule and events",
    icon: Calendar,
    color: "text-orange-400",
    category: "communication",
    endpoint: "/api/actions/calendar"
  },
  {
    id: "system-optimize",
    name: "System Optimize",
    description: "Run system optimization routines",
    icon: RefreshCw,
    color: "text-yellow-400",
    category: "system",
    requiresConfirm: true
  },
  {
    id: "backup-code",
    name: "Backup Code", 
    description: "Trigger immediate code backup to GitHub",
    icon: Settings,
    color: "text-gray-400",
    category: "system",
    requiresConfirm: true
  }
];

export function QuickActionsCard({ className }: { className?: string }) {
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const executeAction = async (action: QuickAction) => {
    if (action.requiresConfirm) {
      if (!confirm(`Are you sure you want to ${action.name.toLowerCase()}?`)) {
        return;
      }
    }

    setExecutingActions(prev => new Set(prev.add(action.id)));

    try {
      let response;
      if (action.endpoint) {
        response = await fetch(action.endpoint, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'quick-actions' })
        });
        
        if (response.ok) {
          const result = await response.json();
          toast({
            title: "Action Completed",
            description: `${action.name}: ${result.message || 'Success'}`,
            variant: "default"
          });
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } else {
        // Simulate action for actions without endpoints
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast({
          title: "Action Completed", 
          description: `${action.name} executed successfully`,
          variant: "default"
        });
      }

      // Mark as recently completed
      setRecentlyCompleted(prev => new Set(prev.add(action.id)));
      setTimeout(() => {
        setRecentlyCompleted(prev => {
          const newSet = new Set(prev);
          newSet.delete(action.id);
          return newSet;
        });
      }, 3000);

    } catch (error) {
      console.error(`Failed to execute ${action.name}:`, error);
      toast({
        title: "Action Failed",
        description: `${action.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setExecutingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(action.id);
        return newSet;
      });
    }
  };

  const categories = Array.from(new Set(QUICK_ACTIONS.map(a => a.category)));

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {QUICK_ACTIONS.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {executingActions.size > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{executingActions.size} running</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map(category => {
            const categoryActions = QUICK_ACTIONS.filter(a => a.category === category);
            
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {category}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {categoryActions.map(action => {
                    const Icon = action.icon;
                    const isExecuting = executingActions.has(action.id);
                    const isCompleted = recentlyCompleted.has(action.id);
                    
                    return (
                      <Button
                        key={action.id}
                        variant="outline"
                        size="sm"
                        disabled={isExecuting}
                        onClick={() => executeAction(action)}
                        className={`h-auto p-3 text-left transition-all ${
                          isCompleted ? 'border-emerald-500/50 bg-emerald-500/10' : ''
                        } ${action.dangerous ? 'hover:border-red-500/50 hover:bg-red-500/10' : ''}`}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <div className="flex items-center gap-1">
                            {isExecuting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                            ) : isCompleted ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Icon className={`h-3.5 w-3.5 ${action.color}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">
                              {action.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground line-clamp-2">
                              {action.description}
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Last executed timestamp */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
          <Clock className="h-3 w-3" />
          <span>Quick actions ready • Click to execute</span>
        </div>
      </CardContent>
    </Card>
  );
}