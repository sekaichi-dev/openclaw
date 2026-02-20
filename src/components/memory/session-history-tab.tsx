"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Search, Hash } from "lucide-react";

interface Session {
  key?: string;
  id?: string;
  lastUpdated?: string;
  messageCount?: number;
  channel?: string;
  lastMessage?: string;
  preview?: string;
}

export function SessionHistoryTab() {
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const url = debouncedQuery
        ? `/api/sessions?q=${encodeURIComponent(debouncedQuery)}`
        : "/api/sessions";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">
              Session History
            </CardTitle>
            {!loading && (
              <Badge variant="secondary" className="ml-1">
                {sessions.length}
              </Badge>
            )}
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {debouncedQuery
              ? "No sessions match your search."
              : "No sessions found."}
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              {sessions.map((session, idx) => (
                <div
                  key={session.key || session.id || idx}
                  className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm font-medium font-mono truncate">
                          {session.key || session.id || "Unknown"}
                        </p>
                      </div>
                      {(session.lastMessage || session.preview) && (
                        <p className="mt-1 text-xs text-muted-foreground truncate pl-5">
                          {session.lastMessage || session.preview}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {session.channel && (
                        <Badge variant="outline" className="text-[10px] h-4">
                          {session.channel}
                        </Badge>
                      )}
                      {session.messageCount != null && (
                        <span className="text-xs text-muted-foreground">
                          {session.messageCount} msgs
                        </span>
                      )}
                    </div>
                  </div>
                  {session.lastUpdated && (
                    <p className="mt-1 text-[11px] text-muted-foreground pl-5">
                      {new Date(session.lastUpdated).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
