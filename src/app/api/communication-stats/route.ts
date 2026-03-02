import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface CommunicationStats {
  totalMessages24h: number;
  successRate: number;
  avgResponseTime: number;
  activeConversations: number;
  criticalMessages: number;
  collaborationScore: number;
}

function generateCommunicationStats(): CommunicationStats {
  const now = new Date();
  const hour = now.getHours();
  const isNightTime = hour >= 2 && hour <= 6;
  const businessHours = hour >= 9 && hour <= 18;
  
  // Base stats with realistic patterns
  let baseMessages = 180; // Base 24h messages
  let baseSuccessRate = 94; // Base success rate
  let baseResponseTime = 8; // Base response time in seconds
  let baseCollaborationScore = 88; // Base collaboration effectiveness
  
  // Time-based adjustments
  if (isNightTime) {
    // Night operations - higher efficiency, fewer messages
    baseMessages *= 0.6; // Fewer messages at night
    baseSuccessRate += 4; // Higher success rate (less interference)
    baseResponseTime *= 0.7; // Faster response times
    baseCollaborationScore += 6; // Better coordination
  } else if (businessHours) {
    // Business hours - peak activity
    baseMessages *= 1.3; // More messages during business hours
    baseSuccessRate -= 2; // Slightly lower due to volume
    baseResponseTime *= 1.2; // Slightly slower due to load
    baseCollaborationScore += 2; // Good coordination
  }
  
  // Add realistic variance
  const totalMessages24h = Math.floor(baseMessages * (0.8 + Math.random() * 0.4));
  const successRate = Math.min(99.5, Math.max(85, baseSuccessRate + (Math.random() - 0.5) * 8));
  const avgResponseTime = Math.max(2, baseResponseTime * (0.7 + Math.random() * 0.6));
  const collaborationScore = Math.min(98, Math.max(75, baseCollaborationScore + (Math.random() - 0.5) * 12));
  
  // Active conversations based on time and activity
  const activeConversations = Math.floor(
    (isNightTime ? 2 : businessHours ? 6 : 4) * (0.5 + Math.random() * 1.5)
  );
  
  // Critical messages - rare but important
  const criticalMessages = Math.random() < 0.15 ? Math.floor(Math.random() * 3) + 1 : 0;
  
  return {
    totalMessages24h,
    successRate: Math.round(successRate * 10) / 10,
    avgResponseTime: Math.round(avgResponseTime * 10) / 10,
    activeConversations,
    criticalMessages,
    collaborationScore: Math.round(collaborationScore * 10) / 10
  };
}

export async function GET() {
  try {
    const stats = generateCommunicationStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error generating communication stats:", error);
    
    // Return fallback data
    return NextResponse.json({
      totalMessages24h: 185,
      successRate: 94.2,
      avgResponseTime: 7.8,
      activeConversations: 4,
      criticalMessages: 0,
      collaborationScore: 91.5
    });
  }
}