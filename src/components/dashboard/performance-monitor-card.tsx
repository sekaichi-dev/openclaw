"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/use-polling";
import { 
  Activity,
  Cpu,
  MemoryStick,
  Network,
  HardDrive,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  EyeOff,
  BarChart3,
  Maximize2
} from "lucide-react";

interface PerformanceMetric {
  timestamp: number;
  cpu: number;
  memory: number;
  network: number;
  disk: number;
  responseTime: number;
  activeConnections: number;
}

interface PerformanceData {
  current: PerformanceMetric;
  history: PerformanceMetric[];
  alerts: PerformanceAlert[];
}

interface PerformanceAlert {
  id: string;
  type: "warning" | "critical" | "info";
  metric: "cpu" | "memory" | "network" | "disk" | "response";
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

// Mini chart component for drawing performance graphs
function MiniChart({ 
  data, 
  color, 
  height = 40, 
  showGrid = false 
}: { 
  data: number[], 
  color: string, 
  height?: number,
  showGrid?: boolean 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, chartHeight);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 0.5;
      
      // Horizontal grid lines
      for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    if (data.length < 2) return;

    const max = Math.max(...data, 100); // Ensure at least 100 for percentage scales
    const min = Math.min(...data, 0);
    const range = max - min;

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = chartHeight - ((value - min) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw gradient fill
    ctx.lineTo(width, chartHeight);
    ctx.lineTo(0, chartHeight);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
    gradient.addColorStop(0, `${color}20`);
    gradient.addColorStop(1, `${color}05`);
    ctx.fillStyle = gradient;
    ctx.fill();

  }, [data, color, height, showGrid]);

  return (
    <canvas 
      ref={canvasRef}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}

// Generate realistic performance data
function generatePerformanceData(previousData?: PerformanceData): PerformanceData {
  const now = Date.now();
  const prev = previousData?.current;
  
  // Generate realistic fluctuations
  const cpu = Math.max(0, Math.min(100, (prev?.cpu || 25) + (Math.random() - 0.5) * 10));
  const memory = Math.max(0, Math.min(100, (prev?.memory || 65) + (Math.random() - 0.5) * 5));
  const network = Math.max(0, Math.min(100, (prev?.network || 15) + (Math.random() - 0.5) * 20));
  const disk = Math.max(0, Math.min(100, (prev?.disk || 45) + (Math.random() - 0.5) * 3));
  const responseTime = Math.max(10, (prev?.responseTime || 150) + (Math.random() - 0.5) * 50);
  const activeConnections = Math.max(0, (prev?.activeConnections || 12) + Math.floor((Math.random() - 0.5) * 4));

  const current: PerformanceMetric = {
    timestamp: now,
    cpu,
    memory,
    network,
    disk,
    responseTime,
    activeConnections
  };

  // Build history (keep last 20 points)
  const history = previousData?.history || [];
  const newHistory = [...history, current].slice(-20);

  // Generate alerts based on thresholds
  const alerts: PerformanceAlert[] = [];
  
  if (cpu > 80) {
    alerts.push({
      id: `cpu-${now}`,
      type: cpu > 95 ? "critical" : "warning",
      metric: "cpu",
      message: `High CPU usage detected`,
      value: cpu,
      threshold: 80,
      timestamp: now
    });
  }

  if (memory > 85) {
    alerts.push({
      id: `memory-${now}`,
      type: memory > 95 ? "critical" : "warning", 
      metric: "memory",
      message: `High memory usage detected`,
      value: memory,
      threshold: 85,
      timestamp: now
    });
  }

  if (responseTime > 500) {
    alerts.push({
      id: `response-${now}`,
      type: responseTime > 1000 ? "critical" : "warning",
      metric: "response",
      message: `Slow response times detected`,
      value: responseTime,
      threshold: 500,
      timestamp: now
    });
  }

  return {
    current,
    history: newHistory,
    alerts
  };
}

const METRIC_CONFIG = {
  cpu: { icon: Cpu, color: "#f59e0b", label: "CPU", unit: "%" },
  memory: { icon: MemoryStick, color: "#8b5cf6", label: "Memory", unit: "%" },
  network: { icon: Network, color: "#06b6d4", label: "Network", unit: "%" },
  disk: { icon: HardDrive, color: "#10b981", label: "Disk I/O", unit: "%" },
  responseTime: { icon: Zap, color: "#f472b6", label: "Response", unit: "ms" }
};

export function PerformanceMonitorCard({ className }: { className?: string }) {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<keyof typeof METRIC_CONFIG | "all">("all");
  const [showDetails, setShowDetails] = useState(false);

  // Update performance data every 2 seconds
  useEffect(() => {
    const updateData = () => {
      setPerformanceData(prev => generatePerformanceData(prev || undefined));
    };

    updateData(); // Initial data
    const interval = setInterval(updateData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!performanceData) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Performance Monitor</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { current, history, alerts } = performanceData;
  const recentAlerts = alerts.slice(0, 3);
  const criticalAlerts = alerts.filter(a => a.type === "critical").length;
  const warningAlerts = alerts.filter(a => a.type === "warning").length;

  const getHealthStatus = () => {
    if (criticalAlerts > 0) return { status: "critical", color: "text-red-400", icon: AlertTriangle };
    if (warningAlerts > 0) return { status: "warning", color: "text-yellow-400", icon: AlertTriangle };
    return { status: "healthy", color: "text-emerald-400", icon: CheckCircle2 };
  };

  const health = getHealthStatus();
  const HealthIcon = health.icon;

  const getTrend = (metricKey: keyof PerformanceMetric) => {
    if (history.length < 2) return null;
    const recent = history.slice(-3).map(h => h[metricKey] as number);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const prev = history.slice(-6, -3).map(h => h[metricKey] as number);
    const prevAvg = prev.length > 0 ? prev.reduce((a, b) => a + b, 0) / prev.length : avg;
    
    if (avg > prevAvg * 1.1) return { icon: TrendingUp, color: "text-red-400" };
    if (avg < prevAvg * 0.9) return { icon: TrendingDown, color: "text-emerald-400" };
    return { icon: Minus, color: "text-gray-400" };
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Performance Monitor</CardTitle>
            <HealthIcon className={`h-4 w-4 ${health.color}`} />
          </div>
          <div className="flex items-center gap-2">
            {criticalAlerts > 0 && (
              <Badge variant="outline" className="text-red-400 bg-red-500/20 border-red-500/30 text-[10px] h-4 px-1.5">
                {criticalAlerts} Critical
              </Badge>
            )}
            {warningAlerts > 0 && (
              <Badge variant="outline" className="text-yellow-400 bg-yellow-500/20 border-yellow-500/30 text-[10px] h-4 px-1.5">
                {warningAlerts} Warning  
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showDetails ? (
          <div className="space-y-4">
            {/* Metric selector */}
            <div className="flex flex-wrap gap-1">
              <Button
                variant={selectedMetric === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => setSelectedMetric("all")}
              >
                All
              </Button>
              {Object.entries(METRIC_CONFIG).map(([key, config]) => (
                <Button
                  key={key}
                  variant={selectedMetric === key ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => setSelectedMetric(key as keyof typeof METRIC_CONFIG)}
                >
                  <config.icon className="h-2.5 w-2.5 mr-1" />
                  {config.label}
                </Button>
              ))}
            </div>

            {/* Chart */}
            <div className="space-y-2">
              <div className="h-24 border border-border rounded-lg p-2 bg-muted/10">
                {selectedMetric === "all" ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Select a metric to view detailed chart
                  </div>
                ) : (
                  <MiniChart
                    data={history.map(h => h[selectedMetric as keyof PerformanceMetric] as number)}
                    color={METRIC_CONFIG[selectedMetric as keyof typeof METRIC_CONFIG].color}
                    height={80}
                    showGrid={true}
                  />
                )}
              </div>
              {selectedMetric !== "all" && (
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">
                    {METRIC_CONFIG[selectedMetric as keyof typeof METRIC_CONFIG].label} over last 40 seconds
                  </span>
                </div>
              )}
            </div>

            {/* Recent alerts */}
            {recentAlerts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium">Recent Alerts</h4>
                <div className="space-y-1">
                  {recentAlerts.map(alert => (
                    <div key={alert.id} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/20">
                      <AlertTriangle className={`h-3 w-3 ${alert.type === "critical" ? "text-red-400" : "text-yellow-400"}`} />
                      <span className="flex-1">{alert.message}</span>
                      <span className="text-muted-foreground">
                        {Math.round(alert.value)}{METRIC_CONFIG[alert.metric]?.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Quick metrics grid */}
            {Object.entries(METRIC_CONFIG).map(([key, config]) => {
              const value = current[key as keyof PerformanceMetric] as number;
              const trend = getTrend(key as keyof PerformanceMetric);
              const TrendIcon = trend?.icon;
              const historyData = history.map(h => h[key as keyof PerformanceMetric] as number);
              
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className={`p-2 rounded ${key === "cpu" && value > 80 ? "bg-red-500/20" : 
                                                  key === "memory" && value > 85 ? "bg-red-500/20" :
                                                  key === "responseTime" && value > 500 ? "bg-red-500/20" :
                                                  "bg-muted/30"}`}>
                    <config.icon className={`h-3.5 w-3.5`} style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{config.label}</span>
                      {TrendIcon && (
                        <TrendIcon className={`h-3 w-3 ${trend.color}`} />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {Math.round(value)}{config.unit}
                      </span>
                      <div className="flex-1 h-1">
                        <MiniChart data={historyData.slice(-10)} color={config.color} height={4} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Connections</span>
                <span className="text-sm font-bold">{current.activeConnections}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className={`text-sm font-bold ${health.color}`}>
                  {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
          <Activity className="h-3 w-3" />
          <span>Live monitoring • Updates every 2 seconds</span>
        </div>
      </CardContent>
    </Card>
  );
}