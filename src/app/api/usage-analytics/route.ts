import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

function generateTimeDistribution(): Array<{ hour: number; activity: number }> {
  const distribution = [];
  
  for (let hour = 0; hour < 24; hour++) {
    let activity = 0;
    
    // Simulate realistic usage patterns
    if (hour >= 9 && hour <= 18) {
      // Business hours - higher activity
      activity = Math.floor(Math.random() * 40) + 20; // 20-60 actions
    } else if (hour >= 19 && hour <= 23) {
      // Evening - moderate activity
      activity = Math.floor(Math.random() * 25) + 10; // 10-35 actions
    } else if (hour >= 2 && hour <= 6) {
      // Night autonomous operations
      activity = Math.floor(Math.random() * 15) + 5; // 5-20 actions
    } else {
      // Late night/early morning - low activity
      activity = Math.floor(Math.random() * 8) + 2; // 2-10 actions
    }
    
    distribution.push({ hour, activity });
  }
  
  return distribution;
}

function generateMostUsedFeatures(): Array<{ name: string; usage: number; trend: "up" | "down" | "stable" }> {
  const features = [
    { name: "Quick Actions", usage: 47, trend: "up" as const },
    { name: "Activity Feed", usage: 42, trend: "stable" as const },
    { name: "System Metrics", usage: 38, trend: "up" as const },
    { name: "AI Insights", usage: 35, trend: "up" as const },
    { name: "Virtual Office", usage: 31, trend: "stable" as const },
    { name: "Agents Overview", usage: 28, trend: "stable" as const },
    { name: "Cron Jobs", usage: 24, trend: "down" as const },
    { name: "Japan Villas", usage: 22, trend: "up" as const },
  ];
  
  return features
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 5);
}

export async function GET() {
  try {
    const currentHour = new Date().getHours();
    
    // Generate realistic session data
    const totalSessions = Math.floor(Math.random() * 8) + 12; // 12-20 sessions
    const avgDurationMinutes = Math.floor(Math.random() * 15) + 8; // 8-23 minutes
    const avgSessionDuration = `${avgDurationMinutes}m`;
    
    // Generate autonomy efficiency data
    const tasksAutomated = Math.floor(Math.random() * 20) + 45; // 45-65 tasks
    const humanInterventions = Math.floor(Math.random() * 5) + 3; // 3-8 interventions
    const successRate = Math.floor(((tasksAutomated / (tasksAutomated + humanInterventions)) * 100));
    
    const analytics: UsageAnalytics = {
      totalSessions,
      avgSessionDuration,
      mostUsedFeatures: generateMostUsedFeatures(),
      timeDistribution: generateTimeDistribution(),
      autonomyEfficiency: {
        tasksAutomated,
        humanInterventions,
        successRate
      },
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error generating usage analytics:", error);
    
    // Fallback data
    return NextResponse.json({
      totalSessions: 15,
      avgSessionDuration: "12m",
      mostUsedFeatures: [
        { name: "Quick Actions", usage: 45, trend: "up" },
        { name: "Activity Feed", usage: 38, trend: "stable" },
        { name: "System Metrics", usage: 32, trend: "up" }
      ],
      timeDistribution: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        activity: Math.floor(Math.random() * 30) + 5
      })),
      autonomyEfficiency: {
        tasksAutomated: 52,
        humanInterventions: 4,
        successRate: 93
      },
      lastUpdated: new Date().toISOString()
    } as UsageAnalytics);
  }
}