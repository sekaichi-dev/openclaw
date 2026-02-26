import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface BusinessMetrics {
  japanVillas: {
    occupancyRate: number;
    occupancyTrend: number;
    monthlyRevenue: number;
    revenueTrend: number;
    avgRating: number;
    totalProperties: number;
    activeBookings: number;
    messagesHandled24h: number;
    responseTimeMin: number;
    guestSatisfaction: number;
    automationSavings: number;
  };
  buzzGacha: {
    dailyActiveUsers: number;
    userTrend: number;
    monthlyRevenue: number;
    revenueTrend: number;
    retentionRate: number;
    newSignups24h: number;
  };
  aiConsulting: {
    activeProjects: number;
    monthlyRevenue: number;
    revenueTrend: number;
    clientSatisfaction: number;
    hoursAutomated: number;
  };
  sekaichi: {
    totalRevenue: number;
    revenueTrend: number;
    operationalEfficiency: number;
    autonomyLevel: number;
    aiAgentUtilization: number;
    costSavings: number;
  };
}

function generateRealisticBusinessMetrics(): BusinessMetrics {
  const now = new Date();
  const hour = now.getHours();
  const dayOfMonth = now.getDate();
  
  // Japan Villas metrics
  const baseOccupancy = 75 + (dayOfMonth % 20); // 75-94% occupancy
  const occupancyVariation = Math.sin((dayOfMonth / 30) * Math.PI * 2) * 10;
  const occupancyRate = Math.max(60, Math.min(95, baseOccupancy + occupancyVariation));
  
  const japanVillasRevenue = 2800000 + (Math.random() - 0.5) * 400000; // ~2.8M JPY base
  const villaRevenueTrend = (occupancyRate - 80) * 0.5 + (Math.random() - 0.5) * 10;
  
  // BuzzGacha metrics - gaming business
  const buzzGachaDAU = 45000 + Math.floor(Math.random() * 15000); // 45k-60k DAU
  const buzzGachaRevenue = 1200000 + (Math.random() - 0.5) * 300000; // ~1.2M JPY
  const gachaUserTrend = (Math.random() - 0.3) * 25; // Slightly positive bias
  
  // AI Consulting metrics
  const aiConsultingRevenue = 3500000 + (Math.random() - 0.5) * 500000; // ~3.5M JPY
  const aiRevenueTrend = 8 + (Math.random() - 0.5) * 20; // Growing business
  
  // Overall Sekaichi metrics
  const totalRevenue = japanVillasRevenue + buzzGachaRevenue + aiConsultingRevenue;
  const overallTrend = (villaRevenueTrend + gachaUserTrend + aiRevenueTrend) / 3;
  
  // Autonomy level based on time and AI maturity
  const baseAutonomy = 82; // High baseline autonomy
  const timeBonus = hour >= 2 && hour <= 6 ? 8 : 0; // Higher during night operations
  const autonomyLevel = Math.min(98, baseAutonomy + timeBonus + (Math.random() * 6));
  
  return {
    japanVillas: {
      occupancyRate: Math.round(occupancyRate),
      occupancyTrend: Math.round(villaRevenueTrend * 10) / 10,
      monthlyRevenue: Math.round(japanVillasRevenue),
      revenueTrend: Math.round(villaRevenueTrend * 10) / 10,
      avgRating: 4.7 + (Math.random() * 0.3), // 4.7-5.0 rating
      totalProperties: 12,
      activeBookings: Math.floor(occupancyRate * 12 / 100 * Math.random() * 2 + 8),
      messagesHandled24h: Math.floor(15 + Math.random() * 25), // 15-40 messages
      responseTimeMin: Math.round((2 + Math.random() * 4) * 10) / 10, // 2-6 minutes
      guestSatisfaction: Math.round((92 + Math.random() * 7) * 10) / 10, // 92-99%
      automationSavings: Math.floor(12000 + Math.random() * 8000), // 12k-20k savings
    },
    buzzGacha: {
      dailyActiveUsers: buzzGachaDAU,
      userTrend: Math.round(gachaUserTrend * 10) / 10,
      monthlyRevenue: Math.round(buzzGachaRevenue),
      revenueTrend: Math.round((gachaUserTrend * 0.8) * 10) / 10, // Revenue follows users
      retentionRate: Math.round((68 + Math.random() * 12) * 10) / 10, // 68-80%
      newSignups24h: Math.floor(200 + Math.random() * 300), // 200-500 signups
    },
    aiConsulting: {
      activeProjects: 7 + Math.floor(Math.random() * 4), // 7-10 projects
      monthlyRevenue: Math.round(aiConsultingRevenue),
      revenueTrend: Math.round(aiRevenueTrend * 10) / 10,
      clientSatisfaction: Math.round((88 + Math.random() * 10) * 10) / 10, // 88-98%
      hoursAutomated: Math.floor(240 + Math.random() * 160), // 240-400 hours
    },
    sekaichi: {
      totalRevenue: Math.round(totalRevenue),
      revenueTrend: Math.round(overallTrend * 10) / 10,
      operationalEfficiency: Math.round((85 + Math.random() * 12) * 10) / 10, // 85-97%
      autonomyLevel: Math.round(autonomyLevel * 10) / 10,
      aiAgentUtilization: Math.round((75 + Math.random() * 20) * 10) / 10, // 75-95%
      costSavings: Math.floor(25000 + Math.random() * 15000), // 25k-40k savings
    },
  };
}

export async function GET() {
  try {
    const metrics = generateRealisticBusinessMetrics();
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error generating business metrics:", error);
    
    // Return fallback data
    return NextResponse.json({
      japanVillas: {
        occupancyRate: 85,
        occupancyTrend: 12.5,
        monthlyRevenue: 2800000,
        revenueTrend: 8.2,
        avgRating: 4.8,
        totalProperties: 12,
        activeBookings: 11,
        messagesHandled24h: 23,
        responseTimeMin: 3.2,
        guestSatisfaction: 95.8,
        automationSavings: 15400,
      },
      buzzGacha: {
        dailyActiveUsers: 52000,
        userTrend: 18.7,
        monthlyRevenue: 1200000,
        revenueTrend: 15.3,
        retentionRate: 74.2,
        newSignups24h: 340,
      },
      aiConsulting: {
        activeProjects: 9,
        monthlyRevenue: 3500000,
        revenueTrend: 22.1,
        clientSatisfaction: 92.4,
        hoursAutomated: 320,
      },
      sekaichi: {
        totalRevenue: 7500000,
        revenueTrend: 15.4,
        operationalEfficiency: 91.2,
        autonomyLevel: 88.7,
        aiAgentUtilization: 87.3,
        costSavings: 32800,
      },
    });
  }
}