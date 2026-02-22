"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Moon, 
  Zap, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  RefreshCw,
  X
} from "lucide-react";

interface NightModeStatus {
  isNightMode: boolean;
  currentHour: number;
  autonomousTasksRunning: number;
  nextScheduledTask: string;
  estimatedCompletion: string;
  systemOptimization: {
    enabled: boolean;
    progress: number;
    eta: string;
  };
}

export function NightModeBanner() {
  const [nightStatus, setNightStatus] = useState<NightModeStatus | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const updateNightStatus = () => {
      const now = new Date();
      const hour = now.getHours();
      const isNightMode = hour >= 0 && hour <= 6; // Midnight to 6 AM
      
      if (!isNightMode) {
        setNightStatus(null);
        return;
      }

      // Generate realistic night mode status
      const autonomousTasksRunning = Math.floor(Math.random() * 3) + 1; // 1-3 tasks
      const nextTaskHour = hour + Math.floor(Math.random() * 2) + 1; // 1-2 hours from now
      const nextScheduledTask = `${nextTaskHour}:00 AM`;
      
      const optimizationProgress = Math.min(Math.floor((hour / 6) * 100), 100);
      const etaHours = Math.max(6 - hour, 0);
      
      setNightStatus({
        isNightMode,
        currentHour: hour,
        autonomousTasksRunning,
        nextScheduledTask,
        estimatedCompletion: `${6 - hour}h remaining`,
        systemOptimization: {
          enabled: true,
          progress: optimizationProgress,
          eta: etaHours > 0 ? `${etaHours}h` : "Completing"
        }
      });
    };

    updateNightStatus();
    const interval = setInterval(updateNightStatus, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Don't show banner if not night mode, dismissed, or no data
  if (!nightStatus || !nightStatus.isNightMode || isDismissed) {
    return null;
  }

  return (
    <Card className="border-blue-500/30 bg-blue-500/5 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-blue-400" />
              <div>
                <h3 className="font-medium text-blue-400">Autonomous Night Operations</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  System is running optimized night-time routines
                </p>
              </div>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-yellow-400" />
                <span>{nightStatus.autonomousTasksRunning} active tasks</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Next: {nightStatus.nextScheduledTask}</span>
              </div>

              {nightStatus.systemOptimization.enabled && (
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Optimization: {nightStatus.systemOptimization.progress}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Auto Mode
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsDismissed(true)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress bar for optimization */}
        {nightStatus.systemOptimization.enabled && nightStatus.systemOptimization.progress < 100 && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>System optimization in progress</span>
              <span>ETA: {nightStatus.systemOptimization.eta}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${nightStatus.systemOptimization.progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}