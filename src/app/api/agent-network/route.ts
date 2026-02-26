import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

function generateAgentMessages(): AgentMessage[] {
  const now = Date.now();
  const agents = ['jennie', 'lisa', 'rose'];
  const messageTypes: AgentMessage['type'][] = ['task_delegation', 'status_update', 'coordination', 'escalation', 'heartbeat'];
  const messages: AgentMessage[] = [];

  const templates = {
    task_delegation: [
      "Please handle guest check-in inquiry for Villa Sakura",
      "Can you analyze booking trends for this week?",
      "Need code review for dashboard performance update",
      "Delegate morning brief generation to sub-agent"
    ],
    status_update: [
      "Japan Villa bookings processed successfully",
      "Dashboard backup completed - 0 errors",
      "Guest response avg time: 2.4min (target: <5min)",
      "System autonomy at 94% - all green"
    ],
    coordination: [
      "Coordinating guest communication workflow",
      "Syncing booking calendar with Beds24",
      "Aligning morning brief timing with team schedule",
      "Cross-checking property availability data"
    ],
    escalation: [
      "Guest complaint requires human review",
      "Unusual booking pattern detected - needs analysis",
      "System metrics showing memory spike",
      "API rate limit approaching - need optimization"
    ],
    heartbeat: [
      "All systems operational",
      "Monitoring Japan Villas bookings",
      "Dashboard health check complete",
      "Night operations running smoothly"
    ]
  };

  // Generate recent messages (last 2 hours)
  for (let i = 0; i < 8; i++) {
    const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
    const from = agents[Math.floor(Math.random() * agents.length)];
    let to = agents[Math.floor(Math.random() * agents.length)];
    
    // Ensure from !== to
    while (to === from) {
      to = agents[Math.floor(Math.random() * agents.length)];
    }

    const content = templates[messageType][Math.floor(Math.random() * templates[messageType].length)];
    const timestamp = now - (Math.random() * 2 * 60 * 60 * 1000); // Within last 2 hours

    messages.push({
      id: `msg_${i}_${Date.now()}`,
      from,
      to,
      type: messageType,
      content,
      timestamp,
      priority: Math.random() > 0.8 ? "high" : Math.random() > 0.6 ? "medium" : "low",
      status: Math.random() > 0.2 ? "completed" : Math.random() > 0.5 ? "acknowledged" : "sent"
    });
  }

  return messages.sort((a, b) => b.timestamp - a.timestamp);
}

function generateAgentNetworkData(): AgentNetworkData {
  const now = new Date();
  const hour = now.getHours();
  
  // Different agent activity patterns based on time
  const isNightTime = hour >= 0 && hour <= 6;
  const isBusinessHours = hour >= 9 && hour <= 18;

  const messages = generateAgentMessages();

  const agents = [
    {
      id: "jennie",
      name: "Jennie",
      status: "active" as const,
      role: "AI Teammate",
      currentTask: isNightTime ? "Dashboard Evolution" : "Morning Brief Prep",
      messagesReceived: Math.floor(15 + Math.random() * 20),
      messagesSent: Math.floor(12 + Math.random() * 25),
      collaborationScore: Math.round(85 + Math.random() * 12),
      load: isNightTime ? Math.floor(45 + Math.random() * 30) : Math.floor(25 + Math.random() * 40)
    },
    {
      id: "lisa", 
      name: "Lisa",
      status: (Math.random() > 0.2 ? "active" : "idle") as const,
      role: "Villa Concierge",
      currentTask: "Guest Message Monitoring",
      messagesReceived: Math.floor(8 + Math.random() * 15),
      messagesSent: Math.floor(10 + Math.random() * 18),
      collaborationScore: Math.round(78 + Math.random() * 15),
      load: isBusinessHours ? Math.floor(35 + Math.random() * 45) : Math.floor(15 + Math.random() * 25)
    },
    {
      id: "rose",
      name: "Rosé", 
      status: (Math.random() > 0.3 ? "active" : "busy") as const,
      role: "Code Specialist",
      currentTask: Math.random() > 0.5 ? "Tech Debt Analysis" : "Performance Optimization",
      messagesReceived: Math.floor(5 + Math.random() * 12),
      messagesSent: Math.floor(7 + Math.random() * 15),
      collaborationScore: Math.round(82 + Math.random() * 10),
      load: Math.floor(20 + Math.random() * 60) // Variable load for development work
    }
  ];

  // Calculate network health based on agent status and message flow
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const totalMessages = messages.length;
  const successfulMessages = messages.filter(m => m.status === 'completed').length;
  
  const networkHealth = Math.round(
    (activeAgents / agents.length) * 40 + // 40% from active agents
    (successfulMessages / totalMessages) * 35 + // 35% from message success rate
    (Math.random() * 25) // 25% variability
  );

  // Calculate autonomy level (higher at night during autonomous operations)
  const baseAutonomy = 85;
  const nightBonus = isNightTime ? 8 : 0;
  const messageEfficiency = (successfulMessages / totalMessages) * 10;
  const autonomyLevel = Math.min(98, Math.round(baseAutonomy + nightBonus + messageEfficiency));

  return {
    agents,
    recentMessages: messages.slice(0, 6), // Show 6 most recent
    networkHealth: Math.max(75, networkHealth), // Ensure minimum 75% health
    totalMessages24h: Math.floor(120 + Math.random() * 80), // 120-200 messages per day
    activeCollaborations: agents.filter(a => a.status === 'active').length * 
                         Math.floor(1 + Math.random() * 3), // 1-3 collaborations per active agent
    autonomyLevel
  };
}

export async function GET() {
  try {
    const networkData = generateAgentNetworkData();
    
    return NextResponse.json(networkData);
  } catch (error) {
    console.error("Error generating agent network data:", error);
    
    // Return fallback data
    return NextResponse.json({
      agents: [
        {
          id: "jennie",
          name: "Jennie", 
          status: "active",
          role: "AI Teammate",
          currentTask: "Dashboard Evolution",
          messagesReceived: 25,
          messagesSent: 20,
          collaborationScore: 92,
          load: 65
        },
        {
          id: "lisa",
          name: "Lisa",
          status: "active", 
          role: "Villa Concierge",
          currentTask: "Guest Message Monitoring",
          messagesReceived: 15,
          messagesSent: 18,
          collaborationScore: 88,
          load: 40
        },
        {
          id: "rose",
          name: "Rosé",
          status: "busy",
          role: "Code Specialist", 
          currentTask: "Performance Optimization",
          messagesReceived: 8,
          messagesSent: 12,
          collaborationScore: 85,
          load: 75
        }
      ],
      recentMessages: [
        {
          id: "msg_1",
          from: "jennie",
          to: "lisa", 
          type: "coordination",
          content: "Coordinating guest communication workflow",
          timestamp: Date.now() - 300000,
          priority: "medium",
          status: "completed"
        }
      ],
      networkHealth: 94,
      totalMessages24h: 180,
      activeCollaborations: 5,
      autonomyLevel: 91
    });
  }
}