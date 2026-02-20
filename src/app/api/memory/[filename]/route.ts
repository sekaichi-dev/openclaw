import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { OPENCLAW_WORKSPACE } from "@/lib/constants";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Prevent directory traversal
  if (filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const filePath = path.join(OPENCLAW_WORKSPACE, "memory", filename);
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({ filename, content });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
