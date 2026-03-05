import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export const dynamic = "force-dynamic";

function generateTitle(description: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const prompt = `Title: ${description.slice(0, 200).replace(/\n/g, " ")}`;

    const child = spawn(
      "/Users/sekaichi/.local/bin/claude",
      ["--output-format", "text"],
      {
        env: {
          ...process.env,
          HOME: "/Users/sekaichi",
          PATH: "/Users/sekaichi/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin",
        },
      }
    );

    let out = "";
    let done = false;

    // Manual timeout — spawn doesn't support timeout option  
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        child.kill("SIGTERM");
        reject(new Error("timeout after 8s"));
      }
    }, 8000);

    child.stdout.on("data", (d) => (out += d));
    child.on("close", (code) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      const title = out.trim().replace(/^["'`*\-#]+|["'`*\-#]+$/g, "").trim();
      if (code === 0 && title) resolve(title);
      else reject(new Error(`exited ${code}: ${JSON.stringify(out.slice(0, 100))}`));
    });
    child.on("error", (e) => {
      if (!done) { done = true; clearTimeout(timer); reject(e); }
    });

    child.stdin.write(prompt + "\n");
    child.stdin.end();
  });
}

export async function POST(req: NextRequest) {
  const { description } = await req.json();
  if (!description?.trim()) {
    return NextResponse.json({ error: "description required" }, { status: 400 });
  }

  try {
    const title = await generateTitle(description);
    return NextResponse.json({ title });
  } catch (e: any) {
    console.error("[generate-title] failed:", e?.message);
    const fallback = description.split(/[.\n]/)[0].trim().slice(0, 60);
    return NextResponse.json({ title: fallback });
  }
}
