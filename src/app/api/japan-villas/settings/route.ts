import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const SETTINGS_PATH =
  "/Users/sekaichi/.openclaw/workspace/japan-villas/concierge-settings.json";

const DEFAULT_SETTINGS = {
  autoRespond: true,
  responseDelay: 5,
  tonePresets: ["warm-professional", "casual-friendly", "formal-luxury"],
  activeTone: "warm-professional",
  autoRespondToReviews: false,
  slackNotifications: true,
  customPrompt:
    "Respond warmly and professionally. Mention property name. If unsure, offer to check with the team.",
  properties: [
    {
      name: "LAKE HOUSE 野尻湖",
      location: "Nojiri Lake, Nagano",
      airbnbUrl: "https://airbnb.com/rooms/example1",
      checkIn: "15:00",
      checkOut: "10:00",
      beds24Id: "12345",
    },
    {
      name: "MOUNTAIN VILLA ニセコ",
      location: "Niseko, Hokkaido",
      airbnbUrl: "https://airbnb.com/rooms/example2",
      checkIn: "15:00",
      checkOut: "10:00",
      beds24Id: "12346",
    },
    {
      name: "The Lake Side INN",
      location: "Nojiri Lake, Nagano",
      airbnbUrl: "https://airbnb.com/rooms/example3",
      checkIn: "15:00",
      checkOut: "11:00",
      beds24Id: "12347",
    },
  ],
};

export async function GET() {
  try {
    const data = await readFile(SETTINGS_PATH, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    await mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
    await writeFile(SETTINGS_PATH, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
