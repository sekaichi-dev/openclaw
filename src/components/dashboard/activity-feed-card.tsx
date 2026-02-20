"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, CheckCircle2, XCircle } from "lucide-react";

interface ActivityEntry {
  id?: string;
  timestamp: string;
  type?: string;
  sessionType?: string;
  description: string;
  status: string;
}

const TIME_FILTERS = [
  { label: "1h", value: "1" },
  { label: "6h", value: "6" },
  { label: "12h", value: "12" },
  { label: "24h", value: "24" },
];

export function ActivityFeedCard({ className }: { className?: string }) {
  const [hours, setHours] = useState("24");
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/activity?hours=${hours}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Activity Feed</CardTitle>
            {!loading && (
              <Badge variant="secondary" className="ml-1">
                {entries.length}
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {TIME_FILTERS.map(({ label, value }) => (
              <Button
                key={value}
                variant={hours === value ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setHours(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No activity in the last {hours}h.
          </div>
        ) : (
          <ScrollArea className="h-[340px] pr-4">
            <div className="space-y-1">
              {entries.map((entry, idx) => {
                const isSuccess =
                  entry.status === "success" || entry.status === "ok";
                const isError =
                  entry.status === "error" || entry.status === "failed";
                return (
                  <div
                    key={entry.id || idx}
                    className="flex items-start gap-3 rounded-lg border border-border p-2.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="mt-0.5">
                      {isSuccess ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : isError ? (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <Activity className="h-3.5 w-3.5 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs leading-tight truncate">
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                        {(entry.type || entry.sessionType) && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-3.5 px-1"
                          >
                            {entry.type || entry.sessionType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
