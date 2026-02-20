import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const CHANGELOG_PATH = path.join(
  process.env.HOME || "/home/user",
  ".openclaw",
  "workspace",
  "memory",
  "dashboard-changelog.md"
);

export async function GET() {
  try {
    const content = await readFile(CHANGELOG_PATH, "utf-8");
    return new NextResponse(content, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return new NextResponse("No changelog entries yet. Check back after the first nightly improvement run!", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
