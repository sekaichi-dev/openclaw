import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { OPENCLAW_WORKSPACE } from "@/lib/constants";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const memoryDir = path.join(OPENCLAW_WORKSPACE, "memory");
    const files = await readdir(memoryDir);
    const mdFiles = files.filter((f) => f.endsWith(".md")).sort().reverse();

    const result = await Promise.all(
      mdFiles.map(async (filename) => {
        const filePath = path.join(memoryDir, filename);
        const info = await stat(filePath);
        return {
          filename,
          date: filename.replace(".md", ""),
          size: info.size,
          modified: info.mtime.toISOString(),
        };
      })
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}
