import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME || "", ".openclaw", "workspace");

export async function GET() {
  try {
    const teamPath = path.join(WORKSPACE, "TEAM.md");
    const content = await readFile(teamPath, "utf-8");

    const team = {
      humans: [
        {
          name: "Tenichi Liu",
          role: "Founder & CEO",
          slack: "@Tenichi",
          focus: "Strategic leadership, growing all business units",
          department: "leadership",
          reportsTo: null,
          avatar: "👤",
        },
        {
          name: "Jiro",
          role: "Co-Founder",
          slack: "@ジロー",
          focus: "Marketing, social media, promotions, domestic partnerships & sales",
          department: "leadership",
          reportsTo: "Tenichi Liu",
          avatar: "👤",
        },
        {
          name: "Yoshito Honma",
          role: "Head of Japan Villas",
          slack: "@yoshito.honma",
          focus: "Strategy and creatives for Japan Villas",
          department: "japan-villas",
          reportsTo: "Jiro",
          avatar: "👤",
        },
        {
          name: "Ryosuke Matsumoto",
          role: "Head of Operations & Experience",
          slack: "@Ryosuke matsumoto",
          focus: "Japan Villas CX, World's Orb ops, events. Primary contact for guest questions.",
          department: "japan-villas",
          reportsTo: "Yoshito Honma",
          note: "Also reports to Tenichi for World project",
          avatar: "👤",
        },
        {
          name: "Toyo",
          role: "Manager of Japan Villas",
          slack: "@Toyo",
          focus: "New property acquisitions (manager in training)",
          department: "japan-villas",
          reportsTo: "Yoshito Honma",
          avatar: "👤",
        },
        {
          name: "Kohei Ogawa",
          role: "Head of BuzzGacha",
          slack: "@小川公平",
          focus: "Strategy, operations, IP partnerships",
          department: "buzzgacha",
          reportsTo: "Jiro",
          avatar: "👤",
        },
        {
          name: "Yugo Matsui",
          role: "Manager of BuzzGacha",
          slack: "@Yugo Matsui",
          focus: "Field staff, vendor relationships, location expansion",
          department: "buzzgacha",
          reportsTo: "Kohei Ogawa",
          avatar: "👤",
        },
        {
          name: "Ryoya Hironaka",
          role: "Head of GTM Partnerships",
          slack: "@Ryoya Hironaka",
          focus: "Leading GTM BPO business (no direct reports yet)",
          department: "gtm-bpo",
          reportsTo: "Tenichi Liu",
          avatar: "👤",
        },
        {
          name: "Saki Ishihara",
          role: "Head of World Cafe",
          slack: "@石原 咲",
          focus: "Cafe + co-working space operations in Nakameguro",
          department: "world-cafe",
          reportsTo: "Jiro",
          note: "Sometimes reports to Tenichi for final decisions",
          avatar: "👤",
        },
      ],
      agents: [
        {
          name: "Jennie",
          role: "AI Teammate (Main Agent)",
          model: "Claude Opus 4",
          focus: "Strategic support, automation, dashboard, daily briefs",
          channels: ["Webchat", "Telegram", "Slack"],
          avatar: "🐾",
          status: "active",
          reportsTo: "Tenichi Liu",
        },
      ],
      departments: [
        { id: "leadership", name: "Leadership", color: "#8b5cf6" },
        { id: "japan-villas", name: "Japan Villas", color: "#10b981" },
        { id: "buzzgacha", name: "BuzzGacha", color: "#f59e0b" },
        { id: "gtm-bpo", name: "GTM BPO", color: "#3b82f6" },
        { id: "world-cafe", name: "World Cafe", color: "#ec4899" },
      ],
      raw: content,
    };

    return NextResponse.json(team);
  } catch {
    return NextResponse.json({ humans: [], agents: [], departments: [], raw: "" });
  }
}
