"use client";

import { useEffect, useState } from "react";
import { usePolling } from "@/hooks/use-polling";
import { Clock, Wifi, WifiOff, Server, Zap } from "lucide-react";

interface AgentStatus {
  agent: string;
  status: string;
  model: string;
  lastActivity: string | null;
  activeSessions: number;
}

export function SystemClock() {
  const [time, setTime] = useState<Date | null>(null);
  const { data } = usePolling<AgentStatus>("/api/status", 10000);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  const timeStr = time.toLocaleTimeString("en-US", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const dateStr = time.toLocaleDateString("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const isConnected = !!data;
  const isActive = data?.status === "active";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-2.5">
      {/* Clock */}
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-base font-mono font-bold tracking-wider tabular-nums">
        {timeStr}
      </span>
      <span className="text-xs text-muted-foreground">JST</span>

      <div className="h-3 w-px bg-border" />

      {/* Status indicators - hidden on small screens */}
      <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
        {isConnected ? (
          <Wifi className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-red-400" />
        )}
        <div className="h-3 w-px bg-border" />
        <Zap className={`h-3.5 w-3.5 ${isActive ? "text-emerald-400" : "text-amber-400"}`} />
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1">
          <Server className="h-3.5 w-3.5" />
          <span>{data?.activeSessions ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
