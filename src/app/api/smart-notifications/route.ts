import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface SmartNotification {
  id: string;
  type: "alert" | "success" | "info" | "warning" | "opportunity" | "milestone";
  priority: "low" | "medium" | "high" | "critical";
  category: "system" | "business" | "guests" | "finance" | "automation" | "agents";
  title: string;
  message: string;
  timestamp: number;
  source: string;
  actionable: boolean;
  action?: {
    label: string;
    url?: string;
    dangerous?: boolean;
  };
  metadata?: {
    value?: string;
    trend?: number;
    impact?: string;
  };
  dismissed?: boolean;
  read?: boolean;
}

interface NotificationsData {
  notifications: SmartNotification[];
  unreadCount: number;
  criticalCount: number;
  categories: {
    category: string;
    count: number;
    urgent: number;
  }[];
}

function generateSmartNotifications(): SmartNotification[] {
  const now = Date.now();
  const notifications: SmartNotification[] = [];

  // Business opportunity notifications
  notifications.push({
    id: "biz_villa_surge",
    type: "opportunity",
    priority: "high",
    category: "business",
    title: "High Occupancy Alert",
    message: "Japan Villas showing 92% occupancy - consider dynamic pricing optimization",
    timestamp: now - 15 * 60 * 1000, // 15 minutes ago
    source: "Business Intelligence",
    actionable: true,
    action: {
      label: "Optimize Pricing",
      url: "/japan-villas"
    },
    metadata: {
      value: "92%",
      trend: 15.2,
      impact: "Revenue +$2,400"
    },
    read: false
  });

  // Guest service notifications
  notifications.push({
    id: "guest_response_excellent", 
    type: "milestone",
    priority: "medium",
    category: "guests",
    title: "Response Time Milestone",
    message: "Lisa achieved sub-3 minute average response time for guest inquiries",
    timestamp: now - 45 * 60 * 1000, // 45 minutes ago
    source: "Lisa AI",
    actionable: false,
    metadata: {
      value: "2.4 min",
      trend: -23.5, // Improvement (negative is good for response time)
      impact: "Guest Satisfaction ↗"
    },
    read: true
  });

  // System performance notifications  
  notifications.push({
    id: "system_autonomy_high",
    type: "success", 
    priority: "low",
    category: "system",
    title: "Autonomy Level Peak",
    message: "System autonomy reached 94% during night operations - all processes running smoothly",
    timestamp: now - 2 * 60 * 60 * 1000, // 2 hours ago
    source: "System Monitor", 
    actionable: false,
    metadata: {
      value: "94%",
      trend: 8.3,
      impact: "Efficiency Max"
    },
    read: true
  });

  // Financial notifications
  if (Math.random() > 0.7) {
    notifications.push({
      id: "finance_savings",
      type: "success",
      priority: "medium", 
      category: "finance",
      title: "AI Cost Savings",
      message: "Automation systems saved ¥32,800 in operational costs this month",
      timestamp: now - 3 * 60 * 60 * 1000, // 3 hours ago
      source: "Cost Analyzer",
      actionable: true,
      action: {
        label: "View Report"
      },
      metadata: {
        value: "¥32,800",
        trend: 12.7,
        impact: "Monthly ROI"
      },
      read: false
    });
  }

  // Agent coordination notifications
  notifications.push({
    id: "agents_collab",
    type: "info",
    priority: "low",
    category: "agents", 
    title: "Agent Network Health",
    message: "Jennie, Lisa, and Rosé completed 18 collaborative tasks in the last 6 hours",
    timestamp: now - 30 * 60 * 1000, // 30 minutes ago
    source: "Agent Network",
    actionable: false,
    metadata: {
      value: "18 tasks",
      impact: "Collaboration ↗"
    },
    read: false
  });

  // Automation notifications
  if (Math.random() > 0.6) {
    notifications.push({
      id: "automation_workflow",
      type: "opportunity",
      priority: "medium",
      category: "automation",
      title: "Workflow Optimization", 
      message: "Guest check-in process can be 40% faster with new automation template",
      timestamp: now - 90 * 60 * 1000, // 1.5 hours ago
      source: "Workflow Builder",
      actionable: true,
      action: {
        label: "Deploy Template",
        url: "/workflows"
      },
      metadata: {
        value: "40%", 
        impact: "Time Saved"
      },
      read: false
    });
  }

  // Critical system alerts (rare)
  if (Math.random() > 0.9) {
    notifications.push({
      id: "critical_memory",
      type: "alert",
      priority: "critical",
      category: "system", 
      title: "Memory Usage High",
      message: "System memory usage at 89% - consider restarting background processes",
      timestamp: now - 10 * 60 * 1000, // 10 minutes ago
      source: "System Monitor",
      actionable: true,
      action: {
        label: "Restart Services", 
        dangerous: true
      },
      metadata: {
        value: "89%",
        trend: 15.3,
        impact: "Performance Risk"
      },
      read: false
    });
  }

  // Guest booking notifications
  if (Math.random() > 0.5) {
    notifications.push({
      id: "booking_spike",
      type: "info",
      priority: "medium",
      category: "business",
      title: "Booking Activity",
      message: "3 new villa reservations received in the last hour - peak booking period detected",
      timestamp: now - 20 * 60 * 1000, // 20 minutes ago
      source: "Booking Monitor", 
      actionable: true,
      action: {
        label: "View Bookings",
        url: "/japan-villas"
      },
      metadata: {
        value: "3 bookings",
        impact: "Revenue +¥180k"
      },
      read: false
    });
  }

  // Development notifications
  if (Math.random() > 0.7) {
    notifications.push({
      id: "code_deploy",
      type: "success",
      priority: "low", 
      category: "system",
      title: "Dashboard Update",
      message: "Mission Control dashboard deployed with 2 new business intelligence features",
      timestamp: now - 5 * 60 * 1000, // 5 minutes ago
      source: "Deployment", 
      actionable: false,
      metadata: {
        impact: "Features +"
      },
      read: false
    });
  }

  return notifications.sort((a, b) => b.timestamp - a.timestamp); // Most recent first
}

function categorizeNotifications(notifications: SmartNotification[]) {
  const categories = new Map<string, { count: number; urgent: number }>();
  
  notifications.forEach(notification => {
    const category = notification.category;
    const current = categories.get(category) || { count: 0, urgent: 0 };
    
    current.count++;
    if (notification.priority === "high" || notification.priority === "critical") {
      current.urgent++;
    }
    
    categories.set(category, current);
  });

  return Array.from(categories.entries()).map(([category, data]) => ({
    category,
    ...data
  }));
}

export async function GET() {
  try {
    const notifications = generateSmartNotifications();
    const categories = categorizeNotifications(notifications);
    
    const unreadCount = notifications.filter(n => !n.read).length;
    const criticalCount = notifications.filter(n => n.priority === "critical").length;

    const data: NotificationsData = {
      notifications,
      unreadCount,
      criticalCount,
      categories
    };
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating smart notifications:", error);
    
    // Return fallback data
    return NextResponse.json({
      notifications: [
        {
          id: "fallback_1",
          type: "info",
          priority: "medium",
          category: "system",
          title: "System Status",
          message: "All systems operational",
          timestamp: Date.now() - 60 * 1000,
          source: "System Monitor", 
          actionable: false,
          read: false
        }
      ],
      unreadCount: 1,
      criticalCount: 0,
      categories: [
        { category: "system", count: 1, urgent: 0 }
      ]
    });
  }
}