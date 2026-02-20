"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitCommitHorizontal } from "lucide-react";

export default function ChangelogPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/changelog")
      .then((r) => (r.ok ? r.text() : "No changelog yet."))
      .then(setContent)
      .catch(() => setContent("Failed to load changelog."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Changelog</h2>
        <p className="text-muted-foreground">
          Nightly improvements made by Jennie to Mission Control.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitCommitHorizontal className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Dashboard Evolution</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {content}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
