import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const statePath = join(process.env.OPENCLAW_WORKSPACE || '/Users/sekaichi/.openclaw/workspace', 'japan-villas', 'concierge-state.json');
    const stateContent = await readFile(statePath, 'utf-8');
    const state = JSON.parse(stateContent);
    
    return NextResponse.json({
      ok: true,
      state: {
        lastCheckedMessageId: state.lastCheckedMessageId,
        lastCheckedAt: state.lastCheckedAt,
        processedCount: state.processedMessageIds?.length || 0
      }
    });
  } catch (error) {
    console.warn('Could not read concierge state:', error);
    return NextResponse.json({
      ok: false,
      state: {
        lastCheckedMessageId: 0,
        lastCheckedAt: null,
        processedCount: 0
      }
    });
  }
}