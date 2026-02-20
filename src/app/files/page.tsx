"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  File,
  Folder,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Home,
} from "lucide-react";

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
  modified: string;
  content?: string;
}

export default function FilesPage() {
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [dirContents, setDirContents] = useState<Record<string, FileEntry[]>>(
    {}
  );

  const fetchDir = useCallback(async (dirPath: string) => {
    try {
      const res = await fetch(
        `/api/files?path=${encodeURIComponent(dirPath)}`
      );
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
    } catch {
      // ignore
    }
    return [];
  }, []);

  // Fetch root directory
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchDir("");
      setEntries(data);
      setLoading(false);
    };
    load();
  }, [fetchDir]);

  const toggleDir = async (dirPath: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirPath)) {
      newExpanded.delete(dirPath);
    } else {
      newExpanded.add(dirPath);
      if (!dirContents[dirPath]) {
        const contents = await fetchDir(dirPath);
        setDirContents((prev) => ({ ...prev, [dirPath]: contents }));
      }
    }
    setExpandedDirs(newExpanded);
  };

  const openFile = async (entry: FileEntry) => {
    setSelectedFile(entry);
    setFileContent(null);
    try {
      const res = await fetch(
        `/api/files?path=${encodeURIComponent(entry.path)}&read=true`
      );
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content || "");
      } else {
        setFileContent("Error: Could not read file.");
      }
    } catch {
      setFileContent("Error: Could not read file.");
    }
  };

  const renderTree = (items: FileEntry[], depth: number = 0) => {
    return items.map((entry) => (
      <div key={entry.path}>
        <button
          onClick={() =>
            entry.type === "directory" ? toggleDir(entry.path) : openFile(entry)
          }
          className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/50 ${
            selectedFile?.path === entry.path ? "bg-muted" : ""
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {entry.type === "directory" ? (
            expandedDirs.has(entry.path) ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )
          ) : (
            <span className="w-3.5" />
          )}
          {entry.type === "directory" ? (
            expandedDirs.has(entry.path) ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-blue-400" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-blue-400" />
            )
          ) : (
            <File className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="flex-1 truncate">{entry.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {entry.type === "file" ? formatBytes(entry.size) : ""}
          </span>
        </button>
        {entry.type === "directory" &&
          expandedDirs.has(entry.path) &&
          dirContents[entry.path] && (
            <div>{renderTree(dirContents[entry.path], depth + 1)}</div>
          )}
      </div>
    ));
  };

  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Files</h2>
        <p className="text-muted-foreground">
          Browse the ~/.openclaw/ directory.
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2"
          onClick={() => {
            setCurrentPath("");
            setSelectedFile(null);
            setFileContent(null);
          }}
        >
          <Home className="h-3.5 w-3.5" />
          ~/.openclaw
        </Button>
        {pathParts.map((part, idx) => (
          <span key={idx} className="flex items-center gap-2">
            <span>/</span>
            <span>{part}</span>
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">File Tree</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-7 animate-pulse rounded bg-muted"
                  />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Directory is empty or inaccessible.
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-0.5">{renderTree(entries)}</div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                {selectedFile ? selectedFile.name : "File Viewer"}
              </CardTitle>
            </div>
            {selectedFile && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>{formatBytes(selectedFile.size)}</span>
                <span>
                  Modified: {new Date(selectedFile.modified).toLocaleString()}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground">
                <File className="h-8 w-8 mb-2 opacity-50" />
                <p>Select a file to view its contents.</p>
              </div>
            ) : fileContent === null ? (
              <div className="h-40 animate-pulse rounded bg-muted" />
            ) : (
              <ScrollArea className="h-[600px]">
                <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed p-1">
                  {fileContent}
                </pre>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
