"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Activity, CheckCircle2, XCircle, Search, RotateCcw, Filter } from "lucide-react";

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

const ACTIVITY_TYPES = [
  { label: "All", value: "all" },
  { label: "Agent", value: "agent" },
  { label: "System", value: "system" },
  { label: "Cron", value: "cron" },
  { label: "User", value: "session" },
];

export function ActivityFeedCard({ className }: { className?: string }) {
  const [hours, setHours] = useState("24");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

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

  // Filter entries based on selected type and search query
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Type filter
      if (typeFilter !== "all") {
        const entryType = entry.type || entry.sessionType || "system";
        if (!entryType.toLowerCase().includes(typeFilter)) return false;
      }
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const description = entry.description.toLowerCase();
        const entryType = (entry.type || entry.sessionType || "").toLowerCase();
        return description.includes(query) || entryType.includes(query);
      }
      
      return true;
    });
  }, [entries, typeFilter, searchQuery]);

  useEffect(() => {
    fetchActivity();
    if (autoRefresh) {
      const interval = setInterval(fetchActivity, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchActivity, autoRefresh]);

  return (
    <Card className={className}>
      <CardHeader className="px-4 pt-3 pb-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Activity Feed</CardTitle>
              {!loading && (
                <Badge variant="secondary" className="ml-1">
                  {filteredEntries.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setAutoRefresh(!autoRefresh)}
                title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
              >
                <RotateCcw className={`h-3 w-3 ${autoRefresh ? "text-emerald-500 animate-spin" : "text-muted-foreground"}`} />
              </Button>
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
          
          {/* Search bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3 text-muted-foreground" />
              {ACTIVITY_TYPES.slice(1).map(({ label, value }) => {
                const isActive = typeFilter === value;
                const count = entries.filter(entry => {
                  const entryType = entry.type || entry.sessionType || "system";
                  return entryType.toLowerCase().includes(value);
                }).length;
                
                return (
                  <Button
                    key={value}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 text-xs px-1.5"
                    onClick={() => setTypeFilter(isActive ? "all" : value)}
                  >
                    {label}
                    {count > 0 && (
                      <Badge variant="outline" className="ml-1 h-3.5 px-1 text-[9px]">
                        {count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">
        
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Activity className="h-8 w-8 text-muted-foreground/50 mx-auto" />
            <div className="text-sm text-muted-foreground">
              {entries.length === 0 
                ? `No activity in the last ${hours}h`
                : searchQuery.trim()
                  ? `No results for "${searchQuery}"`
                  : `No ${typeFilter} activity in the last ${hours}h`
              }
            </div>
            {(searchQuery.trim() || typeFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-1">
              {filteredEntries.map((entry, idx) => {
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
                          {(() => {
                            const date = new Date(entry.timestamp);
                            const isToday = date.toDateString() === new Date().toDateString();
                            return isToday 
                              ? date.toLocaleTimeString()
                              : `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                          })()}
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