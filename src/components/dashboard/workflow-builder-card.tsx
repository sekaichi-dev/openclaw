"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Workflow,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Clock,
  Bot,
  MessageSquare,
  Mail,
  Calendar,
  Upload,
  Download,
  Settings,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";

interface WorkflowStep {
  id: string;
  type: "trigger" | "action" | "condition";
  name: string;
  description: string;
  icon: any;
  agent?: string;
  config?: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "draft" | "error";
  steps: WorkflowStep[];
  lastRun?: string;
  nextRun?: string;
  totalRuns: number;
  successRate: number;
  avgDuration: number;
  created: string;
}

const WORKFLOW_TEMPLATES = [
  {
    id: "guest-response-flow",
    name: "Guest Response Automation",
    description: "Auto-respond to villa guest inquiries with Lisa's AI assistance",
    steps: [
      { id: "t1", type: "trigger", name: "New Guest Message", description: "Japan Villas message received", icon: MessageSquare },
      { id: "a1", type: "action", name: "Lisa Analysis", description: "AI analyzes message context", icon: Bot, agent: "Lisa" },
      { id: "c1", type: "condition", name: "Response Needed?", description: "Check if immediate response required", icon: AlertCircle },
      { id: "a2", type: "action", name: "Send Response", description: "Auto-send or suggest reply", icon: MessageSquare }
    ]
  },
  {
    id: "morning-brief-flow", 
    name: "Morning Brief Generation",
    description: "Daily morning briefing compilation and delivery",
    steps: [
      { id: "t2", type: "trigger", name: "Schedule Trigger", description: "Daily at 9:00 AM JST", icon: Clock },
      { id: "a3", type: "action", name: "Collect Data", description: "Gather overnight activities", icon: Download },
      { id: "a4", type: "action", name: "Generate Brief", description: "AI compiles briefing", icon: Bot, agent: "Jennie" },
      { id: "a5", type: "action", name: "Send to Slack", description: "Post to team channel", icon: Upload }
    ]
  },
  {
    id: "code-backup-flow",
    name: "Automated Code Backup",
    description: "Smart code backup with conflict detection",
    steps: [
      { id: "t3", type: "trigger", name: "File Changes", description: "Detect code modifications", icon: Settings },
      { id: "c2", type: "condition", name: "Changes Significant?", description: "Filter minor changes", icon: AlertCircle },
      { id: "a6", type: "action", name: "Create Commit", description: "Auto-commit with AI message", icon: Bot },
      { id: "a7", type: "action", name: "Push to GitHub", description: "Backup to remote repo", icon: Upload }
    ]
  }
];

const SAMPLE_WORKFLOWS: Workflow[] = [
  {
    id: "guest-auto-1",
    name: "Guest Response Automation",
    description: "Auto-respond to villa guest inquiries with Lisa's AI assistance",
    status: "active",
    steps: WORKFLOW_TEMPLATES[0].steps,
    lastRun: "2 minutes ago",
    nextRun: "When triggered",
    totalRuns: 47,
    successRate: 96,
    avgDuration: 1.3,
    created: "2026-02-20"
  },
  {
    id: "morning-brief-1",
    name: "Morning Brief Generation", 
    description: "Daily morning briefing compilation and delivery",
    status: "active",
    steps: WORKFLOW_TEMPLATES[1].steps,
    lastRun: "7 hours ago",
    nextRun: "Tomorrow 9:00 AM",
    totalRuns: 8,
    successRate: 100,
    avgDuration: 34.5,
    created: "2026-02-19"
  },
  {
    id: "code-backup-1",
    name: "Smart Code Backup",
    description: "Automated backup with AI commit messages",
    status: "paused",
    steps: WORKFLOW_TEMPLATES[2].steps,
    lastRun: "1 day ago", 
    nextRun: "Manual resume",
    totalRuns: 156,
    successRate: 98,
    avgDuration: 4.2,
    created: "2026-02-18"
  }
];

const STATUS_COLORS = {
  active: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
  paused: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30", 
  draft: "text-gray-400 bg-gray-500/20 border-gray-500/30",
  error: "text-red-400 bg-red-500/20 border-red-500/30"
};

const STEP_TYPE_COLORS = {
  trigger: "text-blue-400 bg-blue-500/20",
  action: "text-emerald-400 bg-emerald-500/20",
  condition: "text-yellow-400 bg-yellow-500/20"
};

export function WorkflowBuilderCard({ className }: { className?: string }) {
  const [workflows, setWorkflows] = useState<Workflow[]>(SAMPLE_WORKFLOWS);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleWorkflowStatus = async (workflowId: string) => {
    setExecutingAction(workflowId);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      
      setWorkflows(prev => prev.map(w => {
        if (w.id === workflowId) {
          const newStatus = w.status === "active" ? "paused" : "active";
          return { 
            ...w, 
            status: newStatus,
            nextRun: newStatus === "active" ? "When triggered" : "Manual resume"
          };
        }
        return w;
      }));

      toast({
        title: "Workflow Updated",
        description: `Workflow has been ${workflows.find(w => w.id === workflowId)?.status === "active" ? "paused" : "activated"}`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Action Failed", 
        description: "Failed to update workflow status",
        variant: "destructive"
      });
    } finally {
      setExecutingAction(null);
    }
  };

  const runWorkflowNow = async (workflowId: string) => {
    setExecutingAction(workflowId);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate execution
      
      setWorkflows(prev => prev.map(w => {
        if (w.id === workflowId) {
          return { 
            ...w, 
            lastRun: "Just now",
            totalRuns: w.totalRuns + 1
          };
        }
        return w;
      }));

      toast({
        title: "Workflow Executed",
        description: "Workflow completed successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: "Workflow execution encountered an error", 
        variant: "destructive"
      });
    } finally {
      setExecutingAction(null);
    }
  };

  const createFromTemplate = (template: any) => {
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: template.name,
      description: template.description,
      status: "draft",
      steps: template.steps,
      totalRuns: 0,
      successRate: 0,
      avgDuration: 0,
      created: new Date().toISOString().split('T')[0]
    };
    
    setWorkflows(prev => [newWorkflow, ...prev]);
    setSelectedWorkflow(newWorkflow);
    setShowTemplates(false);
    
    toast({
      title: "Workflow Created",
      description: `Created "${template.name}" from template`,
      variant: "default"
    });
  };

  if (showTemplates) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Workflow Templates</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowTemplates(false)}
              className="text-xs"
            >
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {WORKFLOW_TEMPLATES.map(template => (
              <div key={template.id} className="border border-border rounded-lg p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">{template.name}</h4>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {template.steps.map((step, idx) => {
                        const Icon = step.icon;
                        return (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className={`text-[10px] h-5 px-1.5 ${STEP_TYPE_COLORS[step.type]}`}
                          >
                            <Icon className="h-2.5 w-2.5 mr-1" />
                            {step.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => createFromTemplate(template)}
                    className="shrink-0"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedWorkflow) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Workflow Details</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedWorkflow(null)}
              className="text-xs"
            >
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{selectedWorkflow.name}</h3>
                <Badge variant="outline" className={STATUS_COLORS[selectedWorkflow.status]}>
                  {selectedWorkflow.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{selectedWorkflow.description}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Workflow Steps</h4>
              <div className="space-y-2">
                {selectedWorkflow.steps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <div className={`p-1.5 rounded ${STEP_TYPE_COLORS[step.type]}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium">{step.name}</div>
                        <div className="text-[10px] text-muted-foreground">{step.description}</div>
                      </div>
                      {idx < selectedWorkflow.steps.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/20 rounded-lg">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Total Runs</div>
                <div className="text-sm font-bold">{selectedWorkflow.totalRuns}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Success Rate</div>
                <div className="text-sm font-bold">{selectedWorkflow.successRate}%</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Avg Duration</div>
                <div className="text-sm font-bold">{selectedWorkflow.avgDuration}s</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Last Run</div>
                <div className="text-sm font-bold">{selectedWorkflow.lastRun || 'Never'}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={selectedWorkflow.status === "active" ? "secondary" : "default"}
                onClick={() => toggleWorkflowStatus(selectedWorkflow.id)}
                disabled={executingAction === selectedWorkflow.id}
                className="flex-1"
              >
                {executingAction === selectedWorkflow.id ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : selectedWorkflow.status === "active" ? (
                  <Pause className="h-3 w-3 mr-1" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                {selectedWorkflow.status === "active" ? "Pause" : "Activate"}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => runWorkflowNow(selectedWorkflow.id)}
                disabled={executingAction === selectedWorkflow.id}
              >
                {executingAction === selectedWorkflow.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>
            </div>
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
            <Workflow className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Workflow Automation</CardTitle>
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {workflows.length} flows
            </Badge>
          </div>
          <Button 
            size="sm" 
            onClick={() => setShowTemplates(true)}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {workflows.map(workflow => (
            <div 
              key={workflow.id} 
              className="border border-border rounded-lg p-3 transition-colors hover:bg-muted/30 cursor-pointer"
              onClick={() => setSelectedWorkflow(workflow)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium truncate">{workflow.name}</h4>
                    <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${STATUS_COLORS[workflow.status]}`}>
                      {workflow.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{workflow.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span>{workflow.totalRuns} runs</span>
                    <span>{workflow.successRate}% success</span>
                    <span>Last: {workflow.lastRun || 'Never'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWorkflowStatus(workflow.id);
                    }}
                    disabled={executingAction === workflow.id}
                  >
                    {executingAction === workflow.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : workflow.status === "active" ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
          <Workflow className="h-3 w-3" />
          <span>Build autonomous workflows • Click to configure</span>
        </div>
      </CardContent>
    </Card>
  );
}