"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/use-polling";
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Star,
  Building2,
  Globe2,
  MessageSquare,
  Clock,
  Target,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

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

interface BusinessInsight {
  id: string;
  type: "growth" | "alert" | "opportunity" | "milestone";
  business: "japan-villas" | "buzz-gacha" | "ai-consulting" | "sekaichi";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  value?: string;
  trend?: number;
}

const BUSINESS_COLORS = {
  "japan-villas": {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    icon: Building2
  },
  "buzz-gacha": {
    bg: "bg-purple-500/10", 
    border: "border-purple-500/30",
    text: "text-purple-400",
    icon: Star
  },
  "ai-consulting": {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30", 
    text: "text-blue-400",
    icon: Globe2
  },
  "sekaichi": {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400", 
    icon: Target
  }
};

export function BusinessIntelligenceCard() {
  const [selectedView, setSelectedView] = useState<"overview" | "japan-villas" | "buzz-gacha" | "ai-consulting">("overview");
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  
  const { data: metrics, loading } = usePolling<BusinessMetrics>(
    "/api/business-metrics", 
    45000, // Base refresh every 45 seconds
    undefined,
    { 
      priority: "high", 
      adaptiveInterval: true,
      retryCount: 3 
    }
  );

  useEffect(() => {
    if (metrics) {
      generateBusinessInsights(metrics);
    }
  }, [metrics]);

  const generateBusinessInsights = (data: BusinessMetrics) => {
    const newInsights: BusinessInsight[] = [];

    // Japan Villas insights
    if (data.japanVillas.occupancyTrend > 15) {
      newInsights.push({
        id: "jv-occupancy-surge",
        type: "growth",
        business: "japan-villas",
        title: "Occupancy Surge",
        description: `Occupancy rate increased ${data.japanVillas.occupancyTrend.toFixed(1)}% this month`,
        impact: "high",
        value: `${data.japanVillas.occupancyRate}%`,
        trend: data.japanVillas.occupancyTrend
      });
    }

    if (data.japanVillas.responseTimeMin < 5) {
      newInsights.push({
        id: "jv-response-excellence", 
        type: "milestone",
        business: "japan-villas",
        title: "Response Time Excellence",
        description: `Lisa maintaining <5min avg response time`,
        impact: "medium",
        value: `${data.japanVillas.responseTimeMin}min`
      });
    }

    if (data.japanVillas.automationSavings > 10000) {
      newInsights.push({
        id: "jv-automation-roi",
        type: "opportunity", 
        business: "japan-villas",
        title: "Automation ROI",
        description: `AI automation saved $${data.japanVillas.automationSavings.toLocaleString()} this month`,
        impact: "high",
        value: `$${data.japanVillas.automationSavings.toLocaleString()}`
      });
    }

    // Sekaichi overall insights
    if (data.sekaichi.autonomyLevel > 85) {
      newInsights.push({
        id: "sekaichi-autonomy",
        type: "milestone",
        business: "sekaichi", 
        title: "High Autonomy Achieved",
        description: `${data.sekaichi.autonomyLevel}% of operations running autonomously`,
        impact: "high",
        value: `${data.sekaichi.autonomyLevel}%`
      });
    }

    if (data.sekaichi.revenueTrend > 20) {
      newInsights.push({
        id: "sekaichi-growth",
        type: "growth",
        business: "sekaichi",
        title: "Revenue Growth",
        description: `Revenue increased ${data.sekaichi.revenueTrend.toFixed(1)}% this period`,
        impact: "high", 
        trend: data.sekaichi.revenueTrend
      });
    }

    setInsights(newInsights);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <ArrowUpRight className="h-3 w-3 text-emerald-400" />;
    if (trend < -5) return <ArrowDownRight className="h-3 w-3 text-red-400" />;
    return <div className="h-3 w-3" />; // Placeholder for neutral
  };

  if (loading || !metrics) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Business Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Revenue Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="text-2xl font-bold text-emerald-400">
            {formatCurrency(metrics.sekaichi.totalRevenue)}
          </div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            Total Revenue {getTrendIcon(metrics.sekaichi.revenueTrend)}
          </div>
        </div>
        <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="text-2xl font-bold text-blue-400">
            {metrics.sekaichi.autonomyLevel}%
          </div>
          <div className="text-sm text-muted-foreground">
            Autonomy Level
          </div>
        </div>
      </div>

      {/* Business Unit Stats */}
      <div className="space-y-2">
        <div className="flex justify-between items-center p-2 rounded border">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-400" />
            <span className="font-medium">Japan Villas</span>
          </div>
          <div className="text-right">
            <div className="font-bold">{metrics.japanVillas.occupancyRate}% occupied</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              {formatCurrency(metrics.japanVillas.monthlyRevenue)} {getTrendIcon(metrics.japanVillas.revenueTrend)}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center p-2 rounded border">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-purple-400" />
            <span className="font-medium">BuzzGacha</span>
          </div>
          <div className="text-right">
            <div className="font-bold">{metrics.buzzGacha.dailyActiveUsers.toLocaleString()} DAU</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              {formatCurrency(metrics.buzzGacha.monthlyRevenue)} {getTrendIcon(metrics.buzzGacha.revenueTrend)}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center p-2 rounded border">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-blue-400" />
            <span className="font-medium">AI Consulting</span>
          </div>
          <div className="text-right">
            <div className="font-bold">{metrics.aiConsulting.activeProjects} projects</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              {formatCurrency(metrics.aiConsulting.monthlyRevenue)} {getTrendIcon(metrics.aiConsulting.revenueTrend)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderJapanVillas = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 rounded-lg bg-emerald-500/10">
          <div className="text-xl font-bold text-emerald-400">{metrics.japanVillas.occupancyRate}%</div>
          <div className="text-sm text-muted-foreground">Occupancy</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-blue-500/10">
          <div className="text-xl font-bold text-blue-400">{metrics.japanVillas.avgRating}</div>
          <div className="text-sm text-muted-foreground">Avg Rating</div>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Properties:</span>
          <span className="font-medium">{metrics.japanVillas.totalProperties}</span>
        </div>
        <div className="flex justify-between">
          <span>Active Bookings:</span>
          <span className="font-medium">{metrics.japanVillas.activeBookings}</span>
        </div>
        <div className="flex justify-between">
          <span>Messages (24h):</span>
          <span className="font-medium">{metrics.japanVillas.messagesHandled24h}</span>
        </div>
        <div className="flex justify-between">
          <span>Response Time:</span>
          <span className="font-medium">{metrics.japanVillas.responseTimeMin}min</span>
        </div>
        <div className="flex justify-between">
          <span>AI Savings:</span>
          <span className="font-medium text-emerald-400">{formatCurrency(metrics.japanVillas.automationSavings)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Business Intelligence
        </CardTitle>
        <div className="flex gap-1 mt-2">
          <Button
            variant={selectedView === "overview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedView("overview")}
          >
            Overview
          </Button>
          <Button
            variant={selectedView === "japan-villas" ? "secondary" : "ghost"}  
            size="sm"
            onClick={() => setSelectedView("japan-villas")}
          >
            Villas
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {selectedView === "overview" && renderOverview()}
        {selectedView === "japan-villas" && renderJapanVillas()}
        
        {/* Business Insights */}
        {insights.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Key Insights
            </h4>
            <div className="space-y-2">
              {insights.slice(0, 3).map(insight => {
                const config = BUSINESS_COLORS[insight.business];
                return (
                  <div key={insight.id} className={`p-2 rounded border ${config.bg} ${config.border}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${config.text}`}>
                          {insight.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {insight.description}
                        </div>
                      </div>
                      {insight.value && (
                        <Badge variant="secondary" className="ml-2">
                          {insight.value}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}