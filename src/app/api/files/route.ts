import { NextResponse } from "next/server";
import { readdir, readFile, stat } from "fs/promises";
import { OPENCLAW_HOME } from "@/lib/constants";
import path from "path";

export const dynamic = "force-dynamic";

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
  modified: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedPath = searchParams.get("path") || "";
  const readContent = searchParams.get("read") === "true";

  // Resolve and validate path
  const fullPath = path.join(OPENCLAW_HOME, requestedPath);
  const resolved = path.resolve(fullPath);

  // Prevent directory traversal
  if (!resolved.startsWith(OPENCLAW_HOME)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const info = await stat(resolved);

    if (info.isFile()) {
      if (readContent) {
        const content = await readFile(resolved, "utf-8");
        return NextResponse.json({
          name: path.basename(resolved),
          path: requestedPath,
          type: "file" as const,
          size: info.size,
          modified: info.mtime.toISOString(),
          content,
        });
      }
      return NextResponse.json({
        name: path.basename(resolved),
        path: requestedPath,
        type: "file" as const,
        size: info.size,
        modified: info.mtime.toISOString(),
      });
    }

    // Directory listing
    const entries = await readdir(resolved);
    const results: FileEntry[] = [];

    for (const entry of entries) {
      // Skip hidden files starting with .
      if (entry.startsWith(".")) continue;
      try {
        const entryPath = path.join(resolved, entry);
        const entryInfo = await stat(entryPath);
        results.push({
          name: entry,
          path: path.join(requestedPath, entry),
          type: entryInfo.isDirectory() ? "directory" : "file",
          size: entryInfo.size,
          modified: entryInfo.mtime.toISOString(),
        });
      } catch {
        // Skip entries we can't stat
      }
    }

    // Sort: directories first, then alphabetically
    results.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Path not found" },
      { status: 404 }
    );
  }
}
