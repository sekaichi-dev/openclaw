"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

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

export default function ActivityPage() {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activity Feed</h2>
          <p className="text-muted-foreground">
            Live feed of agent activity, sessions, and tool calls.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchActivity}
          className="gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        {TIME_FILTERS.map(({ label, value }) => (
          <Button
            key={value}
            variant={hours === value ? "secondary" : "outline"}
            size="sm"
            onClick={() => setHours(value)}
          >
            Last {label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            {!loading && (
              <Badge variant="secondary" className="ml-1">
                {entries.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No activity found in the last {hours} hour
              {hours !== "1" ? "s" : ""}.
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-1">
                {entries.map((entry, idx) => {
                  const isSuccess =
                    entry.status === "success" || entry.status === "ok";
                  const isError =
                    entry.status === "error" || entry.status === "failed";
                  return (
                    <div
                      key={entry.id || idx}
                      className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="mt-0.5">
                        {isSuccess ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : isError ? (
                          <XCircle className="h-4 w-4 text-red-400" />
                        ) : (
                          <Activity className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm leading-tight truncate">
                          {entry.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                          {(entry.type || entry.sessionType) && (
                            <>
                              <span>-</span>
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4"
                              >
                                {entry.type || entry.sessionType}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          isSuccess
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : isError
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
