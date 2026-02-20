"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePolling } from "@/hooks/use-polling";
import { Sunrise, ChevronDown, ChevronRight } from "lucide-react";

interface Brief {
  filename: string;
  date: string;
  content: string;
  status: string;
  modified: string;
}

export function MorningBriefsTab() {
  const { data: briefs, loading } = usePolling<Brief[]>("/api/briefs", 60000);
  const [expandedBrief, setExpandedBrief] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sunrise className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Morning Briefs</CardTitle>
          {briefs && (
            <Badge variant="secondary" className="ml-1">
              {briefs.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : !briefs || briefs.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No morning briefs found.
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              {briefs.map((brief) => (
                <div key={brief.filename}>
                  <button
                    onClick={() =>
                      setExpandedBrief(
                        expandedBrief === brief.filename
                          ? null
                          : brief.filename
                      )
                    }
                    className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/30"
                  >
                    {expandedBrief === brief.filename ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <Sunrise className="h-4 w-4 shrink-0 text-amber-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{brief.date}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        brief.status === "delivered"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }
                    >
                      {brief.status}
                    </Badge>
                  </button>
                  {expandedBrief === brief.filename && (
                    <div className="ml-11 mt-1 rounded-lg border border-border bg-muted/20 p-4">
                      <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                        {brief.content}
                      </pre>
                    </div>
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
