import { NextResponse } from "next/server";
import { readdir, readFile, stat } from "fs/promises";
import { OPENCLAW_WORKSPACE } from "@/lib/constants";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Look for brief files in workspace/briefs or cron output
    const briefsDir = path.join(OPENCLAW_WORKSPACE, "briefs");
    const files = await readdir(briefsDir);
    const briefFiles = files.filter((f) => f.endsWith(".md")).sort().reverse();

    const result = await Promise.all(
      briefFiles.map(async (filename) => {
        const filePath = path.join(briefsDir, filename);
        const info = await stat(filePath);
        const content = await readFile(filePath, "utf-8");
        return {
          filename,
          date: filename.replace(".md", "").replace("brief-", ""),
          content,
          size: info.size,
          modified: info.mtime.toISOString(),
          status: "delivered",
        };
      })
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}
