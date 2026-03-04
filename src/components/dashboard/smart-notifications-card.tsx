"use client";

import { Card } from "@/components/ui/card";
import { usePolling } from "@/hooks/use-polling";
import { Bell, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SmartNotification {
  id: string;
  type: "alert" | "success" | "info" | "warning";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  timestamp: number;
  actionable: boolean;
  action?: { label: string; url?: string };
  read?: boolean;
}

interface NotificationsData {
  notifications: SmartNotification[];
  unreadCount: number;
  criticalCount: number;
  categories: { category: string; count: number; urgent: number }[];
}

const TYPE_ICON = {
  alert:   { Icon: AlertTriangle, cls: "text-rose-500/80" },
  warning: { Icon: AlertTriangle, cls: "text-amber-500/80" },
  success: { Icon: CheckCircle2,  cls: "text-emerald-500/80" },
  info:    { Icon: Info,          cls: "text-primary/70" },
};

export function SmartNotificationsCard() {
  const { data, loading } = usePolling<NotificationsData>("/api/smart-notifications", 30000);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const notifications = (data?.notifications ?? []).filter((n) => !dismissed.has(n.id));

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Bell className="h-4 w-4 text-muted-foreground" />
          Notifications
        </div>
        {(data?.unreadCount ?? 0) > 0 && (
          <span className="text-[11px] font-medium text-muted-foreground/60">
            {data!.unreadCount} new
          </span>
        )}
      </div>

      <div className="px-4 pb-3">
        <div className="overflow-y-auto max-h-40">
          {loading && !data ? (
            <div className="space-y-2 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-10 rounded bg-muted" />)}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center gap-2 py-2 text-muted-foreground/40 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              All clear
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((n) => {
                const { Icon, cls } = TYPE_ICON[n.type] ?? TYPE_ICON.info;
                return (
                  <div key={n.id} className={cn(
                    "flex items-start gap-2.5 rounded-md px-2.5 py-2 text-xs group",
                    !n.read && "bg-muted/40",
                    n.priority === "critical" && "bg-rose-500/5 border border-rose-500/20",
                  )}>
                    <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", cls)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium leading-tight">{n.title}</p>
                      <p className="text-muted-foreground/70 leading-tight">{n.message}</p>
                    </div>
                    <button
                      onClick={() => setDismissed((p) => new Set([...p, n.id]))}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-muted-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
