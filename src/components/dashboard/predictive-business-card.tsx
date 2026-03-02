"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/use-polling";
import { 
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Zap,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign
} from "lucide-react";

interface PredictiveMetrics {
  revenue: {
    current: number;
    forecast7d: number;
    forecast30d: number;
    confidence: number;
    trend: "up" | "down" | "stable";
    factors: string[];
  };
  occupancy: {
    current: number;
    forecast7d: number;
    forecast30d: number;
    peakPeriods: { date: string; rate: number }[];
    lowPeriods: { date: string; rate: number }[];
  };
  opportunities: {
    id: string;
    type: "pricing" | "marketing" | "operational" | "expansion";
    title: string;
    description: string;
    impact: number; // Revenue impact in JPY
    effort: "low" | "medium" | "high";
    timeframe: string;
    confidence: number;
  }[];
  risks: {
    id: string;
    type: "market" | "operational" | "competitive" | "seasonal";
    title: string;
    description: string;
    probability: number;
    impact: number; // Negative revenue impact
    mitigation: string;
  }[];
  aiInsights: {
    summary: string;
    keyPredictions: string[];
    recommendations: string[];
    marketAnalysis: string;
  };
}

const OPPORTUNITY_COLORS = {
  pricing: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  marketing: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  operational: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  expansion: "bg-amber-500/10 border-amber-500/30 text-amber-400"
};

const RISK_COLORS = {
  market: "bg-red-500/10 border-red-500/30 text-red-400",
  operational: "bg-orange-500/10 border-orange-500/30 text-orange-400", 
  competitive: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  seasonal: "bg-blue-500/10 border-blue-500/30 text-blue-400"
};

export function PredictiveBusinessCard() {
  const [selectedTab, setSelectedTab] = useState<"forecast" | "opportunities" | "risks" | "insights">("forecast");
  
  const { data: predictions, loading } = usePolling<PredictiveMetrics>(
    "/api/predictive-analytics", 
    60000, // 1-minute refresh for predictions
    undefined,
    { 
      priority: "medium", 
      adaptiveInterval: true,
      retryCount: 2 
    }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatConfidence = (confidence: number) => {
    return `${confidence}%`;
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up": return <ArrowUpRight className="h-4 w-4 text-emerald-400" />;
      case "down": return <ArrowDownRight className="h-4 w-4 text-red-400" />;
      case "stable": return <div className="h-4 w-4 rounded-full bg-blue-400" />;
    }
  };

  if (loading || !predictions) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Predictive Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderForecast = () => (
    <div className="space-y-4">
      {/* Revenue Forecast */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Revenue Forecast
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-slate-500/10 border border-slate-500/30">
            <div className="text-lg font-bold">{formatCurrency(predictions.revenue.current)}</div>
            <div className="text-xs text-muted-foreground">Current Month</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="text-lg font-bold text-blue-400">{formatCurrency(predictions.revenue.forecast7d)}</div>
            <div className="text-xs text-muted-foreground">7-Day Forecast</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="text-lg font-bold text-emerald-400">{formatCurrency(predictions.revenue.forecast30d)}</div>
            <div className="text-xs text-muted-foreground">30-Day Forecast</div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTrendIcon(predictions.revenue.trend)}
            <span className="text-sm font-medium">
              {predictions.revenue.trend === "up" ? "Upward" : 
               predictions.revenue.trend === "down" ? "Downward" : "Stable"} Trend
            </span>
          </div>
          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            {formatConfidence(predictions.revenue.confidence)} confidence
          </Badge>
        </div>
      </div>

      {/* Occupancy Forecast */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Occupancy Forecast
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-slate-500/10 border border-slate-500/30">
            <div className="text-lg font-bold">{predictions.occupancy.current}%</div>
            <div className="text-xs text-muted-foreground">Current</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="text-lg font-bold text-blue-400">{predictions.occupancy.forecast7d}%</div>
            <div className="text-xs text-muted-foreground">7-Day Avg</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="text-lg font-bold text-emerald-400">{predictions.occupancy.forecast30d}%</div>
            <div className="text-xs text-muted-foreground">30-Day Avg</div>
          </div>
        </div>
      </div>

      {/* Key Factors */}
      <div>
        <h4 className="font-medium mb-2">Key Factors</h4>
        <div className="space-y-1">
          {predictions.revenue.factors.map((factor, index) => (
            <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-400"></div>
              {factor}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOpportunities = () => (
    <div className="space-y-3 max-h-[300px] overflow-y-auto">
      {predictions.opportunities.map((opportunity) => (
        <div
          key={opportunity.id}
          className={`p-3 rounded-lg border ${OPPORTUNITY_COLORS[opportunity.type]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h5 className="font-medium text-sm">{opportunity.title}</h5>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {opportunity.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{opportunity.description}</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatCurrency(opportunity.impact)}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {opportunity.effort} effort
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {opportunity.timeframe}
                </span>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`${
                opportunity.confidence >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                opportunity.confidence >= 60 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                "bg-red-500/20 text-red-400 border-red-500/30"
              }`}
            >
              {opportunity.confidence}%
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );

  const renderRisks = () => (
    <div className="space-y-3 max-h-[300px] overflow-y-auto">
      {predictions.risks.map((risk) => (
        <div
          key={risk.id}
          className={`p-3 rounded-lg border ${RISK_COLORS[risk.type]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h5 className="font-medium text-sm">{risk.title}</h5>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {risk.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{risk.description}</p>
              <div className="text-xs text-muted-foreground mb-1">
                <strong>Mitigation:</strong> {risk.mitigation}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span>{risk.probability}% probability</span>
                <span>{formatCurrency(Math.abs(risk.impact))} impact</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {risk.probability >= 70 ? (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              ) : risk.probability >= 40 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">AI Analysis Summary</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {predictions.aiInsights.summary}
        </p>
      </div>

      <div>
        <h4 className="font-medium mb-2">Key Predictions</h4>
        <div className="space-y-1">
          {predictions.aiInsights.keyPredictions.map((prediction, index) => (
            <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
              <TrendingUp className="h-3 w-3 mt-0.5 text-emerald-400 flex-shrink-0" />
              {prediction}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Recommendations</h4>
        <div className="space-y-1">
          {predictions.aiInsights.recommendations.map((recommendation, index) => (
            <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
              <Target className="h-3 w-3 mt-0.5 text-blue-400 flex-shrink-0" />
              {recommendation}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Market Analysis</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {predictions.aiInsights.marketAnalysis}
        </p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Predictive Analytics
          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            AI-Powered
          </Badge>
        </CardTitle>
        <div className="flex gap-1 mt-2">
          <Button
            variant={selectedTab === "forecast" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedTab("forecast")}
          >
            Forecast
          </Button>
          <Button
            variant={selectedTab === "opportunities" ? "secondary" : "ghost"}  
            size="sm"
            onClick={() => setSelectedTab("opportunities")}
          >
            Opportunities
          </Button>
          <Button
            variant={selectedTab === "risks" ? "secondary" : "ghost"}  
            size="sm"
            onClick={() => setSelectedTab("risks")}
          >
            Risks
          </Button>
          <Button
            variant={selectedTab === "insights" ? "secondary" : "ghost"}  
            size="sm"
            onClick={() => setSelectedTab("insights")}
          >
            AI Insights
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {selectedTab === "forecast" && renderForecast()}
        {selectedTab === "opportunities" && renderOpportunities()}
        {selectedTab === "risks" && renderRisks()}
        {selectedTab === "insights" && renderInsights()}
        
        {/* Update Status */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
          <Zap className="h-3 w-3" />
          <span>Predictions updated every minute • AI continuously learning</span>
        </div>
      </CardContent>
    </Card>
  );
}