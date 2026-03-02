import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

function generateRealisticAgentMessages(): AgentMessage[] {
  const agents = ["Jennie", "Lisa", "Rosé"];
  const now = new Date();
  const messages: AgentMessage[] = [];
  
  // Generate realistic inter-agent communication based on time of day
  const hour = now.getHours();
  const isNightTime = hour >= 2 && hour <= 6;
  const businessHours = hour >= 9 && hour <= 18;
  
  // Message templates based on realistic agent interactions
  const messageTemplates = {
    task_delegation: [
      {
        content: "Taking over guest inquiry response for Skyline Villa - guest asking about check-in procedures",
        businessUnit: "Japan Villas",
        priority: "medium" as const
      },
      {
        content: "Please handle the morning revenue report generation, I'm focused on guest responses",
        businessUnit: "Business Intelligence",
        priority: "low" as const
      },
      {
        content: "Dashboard refactoring requires attention - performance optimization needed",
        businessUnit: "Mission Control",
        priority: "high" as const
      }
    ],
    status_update: [
      {
        content: "Guest response sent successfully - 2.3 min response time achieved",
        businessUnit: "Japan Villas",
        priority: "low" as const
      },
      {
        content: "Business metrics updated - all revenue streams tracking normally",
        businessUnit: "Business Intelligence", 
        priority: "low" as const
      },
      {
        content: "Code backup completed - 3 repositories successfully pushed to GitHub",
        businessUnit: "Development",
        priority: "low" as const
      }
    ],
    coordination: [
      {
        content: "Synchronizing guest communication protocols - maintaining response quality standards",
        businessUnit: "Japan Villas",
        priority: "medium" as const
      },
      {
        content: "Optimizing dashboard polling intervals during low-activity periods",
        businessUnit: "Mission Control",
        priority: "medium" as const
      },
      {
        content: "Coordinating business intelligence data refresh cycles for efficiency",
        businessUnit: "Business Intelligence",
        priority: "low" as const
      }
    ],
    escalation: [
      {
        content: "Guest complaint requiring immediate attention - cancellation threat",
        businessUnit: "Japan Villas",
        priority: "critical" as const
      },
      {
        content: "System performance degradation detected - response times above threshold",
        businessUnit: "Mission Control", 
        priority: "high" as const
      },
      {
        content: "Revenue tracking anomaly - urgent manual review needed",
        businessUnit: "Business Intelligence",
        priority: "critical" as const
      }
    ],
    heartbeat: [
      {
        content: "System health check - all agents operational",
        businessUnit: "Mission Control",
        priority: "low" as const
      },
      {
        content: "Active monitoring status - Japan Villas operations normal",
        businessUnit: "Japan Villas",
        priority: "low" as const
      }
    ]
  };

  // Generate messages based on time of day and realistic patterns
  const messageCount = isNightTime ? 12 : businessHours ? 25 : 18;
  
  for (let i = 0; i < messageCount; i++) {
    const messageAge = Math.random() * 24 * 60; // 0-24 hours ago
    const timestamp = new Date(now.getTime() - messageAge * 60 * 1000);
    
    // Choose message type based on time patterns
    let messageType: keyof typeof messageTemplates;
    const typeRandom = Math.random();
    
    if (isNightTime) {
      // Night operations - more coordination and status updates
      messageType = typeRandom < 0.4 ? "status_update" : 
                   typeRandom < 0.7 ? "coordination" :
                   typeRandom < 0.9 ? "heartbeat" : "task_delegation";
    } else if (businessHours) {
      // Business hours - more task delegation and escalations
      messageType = typeRandom < 0.35 ? "task_delegation" :
                   typeRandom < 0.65 ? "status_update" :
                   typeRandom < 0.85 ? "coordination" :
                   typeRandom < 0.95 ? "escalation" : "heartbeat";
    } else {
      // Off hours - mixed activity
      messageType = typeRandom < 0.3 ? "status_update" :
                   typeRandom < 0.6 ? "coordination" :
                   typeRandom < 0.8 ? "task_delegation" :
                   typeRandom < 0.95 ? "heartbeat" : "escalation";
    }
    
    const templates = messageTemplates[messageType];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Realistic agent pairings
    const fromAgent = agents[Math.floor(Math.random() * agents.length)];
    let toAgent = agents[Math.floor(Math.random() * agents.length)];
    while (toAgent === fromAgent) {
      toAgent = agents[Math.floor(Math.random() * agents.length)];
    }
    
    // Determine status based on message age and type
    let status: AgentMessage["status"];
    if (messageAge < 5) {
      status = Math.random() < 0.7 ? "sent" : "delivered";
    } else if (messageAge < 30) {
      status = Math.random() < 0.1 ? "failed" : Math.random() < 0.6 ? "acknowledged" : "delivered";
    } else {
      status = Math.random() < 0.05 ? "failed" : "acknowledged";
    }
    
    messages.push({
      id: `msg-${i}-${timestamp.getTime()}`,
      from: fromAgent,
      to: toAgent,
      type: messageType,
      content: template.content,
      timestamp: timestamp.toISOString(),
      status,
      priority: template.priority,
      context: {
        sessionId: `session-${Math.random().toString(36).substring(7)}`,
        taskId: `task-${Math.random().toString(36).substring(7)}`,
        businessUnit: template.businessUnit
      }
    });
  }
  
  // Sort by timestamp (newest first)
  return messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function GET() {
  try {
    const messages = generateRealisticAgentMessages();
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error generating agent messages:", error);
    
    // Return fallback data
    return NextResponse.json([
      {
        id: "fallback-1",
        from: "Jennie",
        to: "Lisa", 
        type: "coordination",
        content: "Synchronizing guest communication protocols for optimal response quality",
        timestamp: new Date().toISOString(),
        status: "acknowledged",
        priority: "medium",
        context: {
          businessUnit: "Japan Villas"
        }
      }
    ]);
  }
}