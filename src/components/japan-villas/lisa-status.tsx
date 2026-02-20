"use client";

import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LisaStatusData {
  status: "online" | "offline";
  activeSessions: number;
  lastActivity: string;
  autoRespond: boolean;
}

interface LisaStatusProps {
  status: LisaStatusData | undefined;
  autoRespond: boolean;
  onToggleAutoRespond: (value: boolean) => void;
}

export function LisaStatus({
  status,
  autoRespond,
  onToggleAutoRespond,
}: LisaStatusProps) {
  const isOnline = status?.status === "online";

  return (
    <div className="flex items-center gap-3">
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5",
          isOnline
            ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
            : "border-muted-foreground/30 text-muted-foreground"
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            isOnline ? "animate-pulse bg-violet-400" : "bg-muted-foreground"
          )}
        />
        <Bot className="h-3.5 w-3.5" />
        Lisa {isOnline ? "Online" : "Offline"}
      </Badge>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
        <span>Auto-Respond</span>
        <button
          type="button"
          onClick={() => onToggleAutoRespond(!autoRespond)}
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
            autoRespond ? "bg-violet-500" : "bg-muted-foreground/30"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 rounded-full bg-white transition-transform",
              autoRespond ? "translate-x-[18px]" : "translate-x-0.5"
            )}
          />
        </button>
      </label>
    </div>
  );
}
