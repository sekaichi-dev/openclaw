import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  try {
    const cmd = q
      ? `openclaw sessions list --json --query "${q}"`
      : `openclaw sessions list --json`;
    const { stdout } = await execAsync(cmd, { timeout: 15000 });
    const data = JSON.parse(stdout.trim());
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}
