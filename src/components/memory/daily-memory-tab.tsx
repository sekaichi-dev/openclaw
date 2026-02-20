"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePolling } from "@/hooks/use-polling";
import { FileText, Calendar, ChevronDown, ChevronRight } from "lucide-react";

interface MemoryFile {
  filename: string;
  date: string;
  size: number;
  modified: string;
}

export function DailyMemoryTab() {
  const { data: files, loading } = usePolling<MemoryFile[]>("/api/memory", 60000);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<Record<string, string>>({});

  const handleToggle = async (filename: string) => {
    if (expandedFile === filename) {
      setExpandedFile(null);
      return;
    }
    setExpandedFile(filename);
    if (!fileContent[filename]) {
      try {
        const res = await fetch(`/api/memory/${encodeURIComponent(filename)}`);
        if (res.ok) {
          const data = await res.json();
          setFileContent((prev) => ({ ...prev, [filename]: data.content }));
        }
      } catch {
        setFileContent((prev) => ({
          ...prev,
          [filename]: "Error loading file.",
        }));
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">
            Daily Memory Files
          </CardTitle>
          {files && (
            <Badge variant="secondary" className="ml-1">
              {files.length}
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
        ) : !files || files.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No memory files found.
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              {files.map((file) => (
                <div key={file.filename}>
                  <button
                    onClick={() => handleToggle(file.filename)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/30"
                  >
                    {expandedFile === file.filename ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <FileText className="h-4 w-4 shrink-0 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.date}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                    </span>
                  </button>
                  {expandedFile === file.filename && (
                    <div className="ml-11 mt-1 rounded-lg border border-border bg-muted/20 p-4">
                      {fileContent[file.filename] ? (
                        <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                          {fileContent[file.filename]}
                        </pre>
                      ) : (
                        <div className="h-20 animate-pulse rounded bg-muted" />
                      )}
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
