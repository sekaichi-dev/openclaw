"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { usePolling } from "@/hooks/use-polling";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AgentStatus { status: string; roseActive?: boolean; }
interface KanbanTask  { assignee: string; status: string; title?: string; description?: string; source: string; isRecurring?: boolean; }
interface KanbanData  { tasks: KanbanTask[]; }
interface Position    { x: number; y: number; }

interface AgentState {
  pos: Position;
  target: Position;
  moving: boolean;
  stepPhase: number;
  facing: "left" | "right";
  wanderTimer: ReturnType<typeof setTimeout> | null;
}

// ── Agent definitions ─────────────────────────────────────────────────────────
const AGENTS = [
  { name: "Jennie", role: "Coordinator",   accent: "#10b981", outfit: "#10b981", hair: "#1a1a1a",  hairStyle: "bob",      skin: "#f5c5a3", deskIdx: 0 },
  { name: "Lisa",   role: "Concierge",     accent: "#a78bfa", outfit: "#a78bfa", hair: "#4a1d78",  hairStyle: "long",     skin: "#f5d0a0", deskIdx: 1 },
  { name: "Jisoo",  role: "Briefing",      accent: "#67e8f9", outfit: "#22d3ee", hair: "#1a1a1a",  hairStyle: "bun",      skin: "#f7c9a8", deskIdx: 2 },
  { name: "Rosé",   role: "Coding",        accent: "#f472b6", outfit: "#f472b6", hair: "#e8c0c8",  hairStyle: "shoulder", skin: "#fce8d8", deskIdx: -1 },
] as const;

// ── Office layout (600 × 360) ─────────────────────────────────────────────────
const W = 600, H = 360;
const PLANK_H = 36;

// Desk positions [x, y, w, h, label]
const DESKS: [number, number, number, number, string][] = [
  [340, 80,  100, 56, "Jennie"],
  [340, 190, 100, 56, "Lisa"],
  [160, 80,  100, 56, "Jisoo"],
  [160, 190, 100, 56, ""],
];

// Bullpen workstations
const BULLPEN = { x: 30, y: 60, w: 100, h: 160 };
const WORKSTATIONS: [number, number][] = [
  [36, 72], [76, 72],
  [36, 112],[76, 112],
  [36, 152],[76, 152],
];

const WANDER_SPOTS = [
  { x: 70, y: 270 }, { x: 230, y: 48 }, { x: 480, y: 260 },
  { x: 290, y: 160 }, { x: 130, y: 260 }, { x: 520, y: 130 },
];
const BULLPEN_SPOTS = [
  { x: 50, y: 88 }, { x: 90, y: 88 }, { x: 50, y: 128 },
  { x: 90, y: 128 }, { x: 50, y: 168 }, { x: 90, y: 168 },
  { x: 220, y: 36 }, // whiteboard
];

function deskSeat(idx: number): Position {
  const [x, y, w, h] = DESKS[idx];
  return { x: x + w / 2, y: y + h + 14 };
}

const MOVE_SPEED = 0.9;

// ── Helpers ───────────────────────────────────────────────────────────────────
function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Drawing helpers ───────────────────────────────────────────────────────────

function drawFloor(ctx: CanvasRenderingContext2D) {
  const planks = ["#c8a270", "#be9860", "#ca9f68", "#bc9b5e"];
  for (let y = 0; y < H; y += PLANK_H) {
    ctx.fillStyle = planks[Math.floor(y / PLANK_H) % planks.length];
    ctx.fillRect(0, y, W, PLANK_H);
    ctx.strokeStyle = "#8b6538";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    // plank joints every 150px offset per row
    const offset = (Math.floor(y / PLANK_H) % 2) * 75;
    for (let x = offset; x < W; x += 150) {
      ctx.strokeStyle = "#9b7248";
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + PLANK_H); ctx.stroke();
    }
  }
  // Rug under meeting table
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#1e5050";
  pill(ctx, 22, 238, 125, 90, 10);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#2a7070";
  ctx.lineWidth = 2;
  pill(ctx, 22, 238, 125, 90, 10);
  ctx.stroke();
  // Rug border detail
  ctx.strokeStyle = "#3a8888";
  ctx.lineWidth = 1;
  pill(ctx, 28, 244, 113, 78, 7);
  ctx.stroke();
}

function drawWalls(ctx: CanvasRenderingContext2D, isDark: boolean) {
  // Baseboard
  ctx.fillStyle = isDark ? "#2e2850" : "#c8b898";
  ctx.fillRect(0, H - 5, W, 5);

  // Right wall art frames
  const frames: [number, number, number, number, string[]][] = [
    [530, 60, 55, 70, ["#e05050", "#50a0e0", "#e0c050", "#50e090"]],
    [530, 160, 55, 60, ["#9050e0", "#50e0c0", "#e07030"]],
  ];
  for (const [fx, fy, fw, fh, colors] of frames) {
    ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 6;
    ctx.fillStyle = isDark ? "#2a1a3a" : "#4a3a2a";
    ctx.fillRect(fx - 4, fy - 4, fw + 8, fh + 8);
    ctx.shadowBlur = 0;
    ctx.fillStyle = isDark ? "#1a1228" : "#f5f0e8";
    ctx.fillRect(fx, fy, fw, fh);
    const stripeW = Math.floor(fw / colors.length);
    colors.forEach((c, i) => {
      ctx.fillStyle = c + "66";
      ctx.fillRect(fx + i * stripeW, fy, stripeW, fh);
    });
    ctx.strokeStyle = isDark ? "#3a2a4a" : "#8a7a6a";
    ctx.lineWidth = 1; ctx.strokeRect(fx, fy, fw, fh);
  }
}

function drawWhiteboard(ctx: CanvasRenderingContext2D, isDark: boolean) {
  const [x, y, w, h] = [155, 8, 170, 20];
  ctx.fillStyle = isDark ? "#2a2840" : "#f0f0f8";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = isDark ? "#4a4870" : "#a0a0c0";
  ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  // Marker drawings
  const lines = [
    { color: "#e05858", x1: x + 10, y1: y + 6, x2: x + 50, y2: y + 6 },
    { color: "#5898e0", x1: x + 10, y1: y + 12, x2: x + 80, y2: y + 12 },
    { color: "#50c878", x1: x + 55, y1: y + 6,  x2: x + 90, y2: y + 6 },
    { color: "#e0a030", x1: x + 95, y1: y + 8,  x2: x + 140, y2: y + 8 },
  ];
  lines.forEach(l => {
    ctx.strokeStyle = l.color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
  });
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, size = 1) {
  const s = size;
  // Pot
  ctx.fillStyle = "#b5622a";
  ctx.beginPath();
  ctx.moveTo(x - 7 * s, y + 4 * s);
  ctx.lineTo(x - 5 * s, y + 12 * s);
  ctx.lineTo(x + 5 * s, y + 12 * s);
  ctx.lineTo(x + 7 * s, y + 4 * s);
  ctx.closePath(); ctx.fill();
  // Leaves
  [["#1a5a1a", 0, 0], ["#2a7a2a", -5 * s, -3 * s], ["#3a8a3a", 5 * s, -4 * s],
   ["#1e6a1e", -2 * s, -6 * s], ["#2e7e2e", 3 * s, -7 * s]].forEach(([c, dx, dy]) => {
    ctx.fillStyle = c as string;
    ctx.beginPath();
    ctx.arc(x + (dx as number), y + (dy as number), 6 * s, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
                  label: string, screenGlow: string, isDark: boolean) {
  // Shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  ctx.fillStyle = isDark ? "#2a1a0a" : "#8B5E3C";
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // Surface shine
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, isDark ? "#3a2a10" : "#a07040");
  grad.addColorStop(1, isDark ? "#1e1208" : "#6a4020");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = isDark ? "#4a3020" : "#5a3010";
  ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);

  // Monitor base
  ctx.fillStyle = isDark ? "#1a1a2a" : "#2a2a3a";
  ctx.fillRect(x + w / 2 - 14, y + 4, 28, 3);
  // Monitor
  ctx.fillStyle = "#080818";
  ctx.fillRect(x + w / 2 - 13, y - 18, 26, 20);
  ctx.strokeStyle = isDark ? "#3a3a5a" : "#4a4a6a";
  ctx.lineWidth = 1; ctx.strokeRect(x + w / 2 - 13, y - 18, 26, 20);
  // Screen glow
  ctx.fillStyle = screenGlow;
  ctx.fillRect(x + w / 2 - 11, y - 16, 22, 16);
  // Keyboard
  ctx.fillStyle = isDark ? "#2a2a3a" : "#5a5a6a";
  ctx.fillRect(x + w / 2 - 12, y + 9, 24, 7);
  ctx.strokeStyle = isDark ? "#3a3a4a" : "#7a7a8a";
  ctx.lineWidth = 0.5; ctx.strokeRect(x + w / 2 - 12, y + 9, 24, 7);
  // Key rows
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      ctx.fillStyle = isDark ? "#3a3a4a" : "#8a8a9a";
      ctx.fillRect(x + w / 2 - 10 + col * 5, y + 10 + row * 3, 4, 2);
    }
  }
  // Nameplate
  if (label) {
    ctx.fillStyle = isDark ? "#1a1018" : "#f0e8d0";
    ctx.fillRect(x + 4, y + h - 12, w - 8, 10);
    ctx.fillStyle = isDark ? "#a09080" : "#6a5040";
    ctx.font = "7px monospace"; ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, y + h - 5);
  }
  // Chair
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 6;
  ctx.fillStyle = isDark ? "#201830" : "#9090b0";
  ctx.beginPath(); ctx.arc(x + w / 2, y + h + 14, 10, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBullpen(ctx: CanvasRenderingContext2D, roseActive: boolean, isDark: boolean) {
  // Background
  ctx.fillStyle = isDark ? "#180e28" : "#ece8f8";
  ctx.fillRect(BULLPEN.x, BULLPEN.y, BULLPEN.w, BULLPEN.h);
  ctx.strokeStyle = isDark ? "#2e2248" : "#c0b8e0";
  ctx.lineWidth = 1; ctx.strokeRect(BULLPEN.x, BULLPEN.y, BULLPEN.w, BULLPEN.h);
  // Label
  ctx.fillStyle = isDark ? "#5a4880" : "#7060a0";
  ctx.font = "7px monospace"; ctx.textAlign = "center";
  ctx.fillText("Dev Bullpen", BULLPEN.x + BULLPEN.w / 2, BULLPEN.y - 4);

  const glow = roseActive ? "rgba(244,114,182,0.45)" : "rgba(244,114,182,0.12)";
  WORKSTATIONS.forEach(([wx, wy]) => {
    ctx.fillStyle = isDark ? "#221840" : "#d8d0f0";
    ctx.fillRect(wx, wy, 28, 22);
    ctx.strokeStyle = isDark ? "#3a2a58" : "#b0a8d8";
    ctx.lineWidth = 0.5; ctx.strokeRect(wx, wy, 28, 22);
    ctx.fillStyle = "#060614";
    ctx.fillRect(wx + 4, wy + 2, 20, 14);
    ctx.fillStyle = glow;
    ctx.fillRect(wx + 5, wy + 3, 18, 12);
    // Chair
    ctx.fillStyle = isDark ? "#1a1230" : "#a090c8";
    ctx.beginPath(); ctx.arc(wx + 14, wy + 28, 5, 0, Math.PI * 2); ctx.fill();
  });
}

function drawMeetingTable(ctx: CanvasRenderingContext2D, isDark: boolean) {
  const cx = 84, cy = 284;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 8;
  ctx.fillStyle = isDark ? "#1e0e00" : "#7a5030";
  ctx.beginPath(); ctx.ellipse(cx, cy, 42, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  const tableGrad = ctx.createRadialGradient(cx - 10, cy - 8, 2, cx, cy, 42);
  tableGrad.addColorStop(0, isDark ? "#3a1e08" : "#9a6840");
  tableGrad.addColorStop(1, isDark ? "#180a00" : "#6a4020");
  ctx.fillStyle = tableGrad;
  ctx.beginPath(); ctx.ellipse(cx, cy, 42, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isDark ? "#4a2a10" : "#5a3010"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(cx, cy, 42, 28, 0, 0, Math.PI * 2); ctx.stroke();
  // Chairs
  [[cx, cy - 36], [cx, cy + 36], [cx - 52, cy], [cx + 52, cy]].forEach(([cx2, cy2]) => {
    ctx.fillStyle = isDark ? "#201838" : "#8888aa";
    ctx.beginPath(); ctx.arc(cx2 as number, cy2 as number, 8, 0, Math.PI * 2); ctx.fill();
  });
  // Centerpiece
  drawPlant(ctx, cx, cy - 4, 0.55);
}

function drawCoffeeStation(ctx: CanvasRenderingContext2D, isDark: boolean) {
  const x = 16, y = 196;
  ctx.fillStyle = isDark ? "#1e1c2e" : "#d8d4e8";
  ctx.fillRect(x, y, 28, 36);
  ctx.strokeStyle = isDark ? "#3a3850" : "#b0a8c8"; ctx.lineWidth = 1;
  ctx.strokeRect(x, y, 28, 36);
  // Machine body
  ctx.fillStyle = isDark ? "#141220" : "#b0a8c0";
  ctx.fillRect(x + 4, y + 4, 20, 22);
  // Buttons
  [[x + 8, y + 8], [x + 16, y + 8]].forEach(([bx, by]) => {
    ctx.fillStyle = "#e05050"; ctx.beginPath();
    ctx.arc(bx as number, by as number, 2, 0, Math.PI * 2); ctx.fill();
  });
  // Cup
  ctx.fillStyle = isDark ? "#2a2838" : "#f0ece8";
  ctx.fillRect(x + 10, y + 28, 8, 6);
  // Steam
  ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1.5;
  [x + 13, x + 17].forEach(sx => {
    ctx.beginPath();
    ctx.moveTo(sx, y + 26);
    ctx.quadraticCurveTo(sx - 3, y + 20, sx, y + 14);
    ctx.stroke();
  });
}

// ── Avatar drawing ────────────────────────────────────────────────────────────
function drawAvatar(
  ctx: CanvasRenderingContext2D,
  state: AgentState,
  agent: typeof AGENTS[number],
  active: boolean,
) {
  const { pos, moving, stepPhase, facing } = state;
  const { skin, hair, hairStyle, outfit, accent, name } = agent;
  const flip = facing === "left" ? -1 : 1;

  ctx.save();

  // Body shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(pos.x, pos.y + 20, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Legs ──────────────────────────────────────────────────────────────────
  const step = Math.floor(stepPhase / 8) % 2;
  const lLeg = moving ? (step ? 4 : -2) : 0;
  const rLeg = moving ? (step ? -2 : 4) : 0;
  ctx.fillStyle = isDarker(outfit) ? "#303040" : "#404050";
  // Left leg
  ctx.fillRect(pos.x - 5, pos.y + 10, 4, 10 + lLeg);
  // Right leg
  ctx.fillRect(pos.x + 1, pos.y + 10, 4, 10 + rLeg);
  // Feet
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(pos.x - 6 + (moving && step ? 2 : 0) * flip, pos.y + 19 + lLeg, 5, 3);
  ctx.fillRect(pos.x + 1 + (moving && !step ? 2 : 0) * flip, pos.y + 19 + rLeg, 5, 3);

  // ── Body/torso ────────────────────────────────────────────────────────────
  const bodyGrad = ctx.createLinearGradient(pos.x - 7, pos.y, pos.x + 7, pos.y + 12);
  bodyGrad.addColorStop(0, lighten(outfit, 0.15));
  bodyGrad.addColorStop(1, outfit);
  ctx.fillStyle = bodyGrad;
  pill(ctx, pos.x - 7, pos.y, 14, 12, 3);
  ctx.fill();

  // ── Arms ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = lighten(outfit, 0.1);
  const armSwing = moving ? Math.sin(stepPhase / 8 * Math.PI) * 3 : 0;
  ctx.fillRect(pos.x - 10, pos.y + 1 + armSwing, 4, 8);
  ctx.fillRect(pos.x + 6,  pos.y + 1 - armSwing, 4, 8);

  // ── Head ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(pos.x, pos.y - 7, 8, 0, Math.PI * 2); ctx.fill();

  // ── Hair ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = hair;
  if (hairStyle === "bob") {
    ctx.beginPath(); ctx.arc(pos.x, pos.y - 8, 8.5, Math.PI, 0); ctx.fill();
    ctx.fillRect(pos.x - 8.5, pos.y - 10, 4, 10);
    ctx.fillRect(pos.x + 4.5, pos.y - 10, 4, 10);
  } else if (hairStyle === "long") {
    ctx.beginPath(); ctx.arc(pos.x, pos.y - 8, 8.5, Math.PI, 0); ctx.fill();
    ctx.fillRect(pos.x - 8.5, pos.y - 9, 4, 16);
    ctx.fillRect(pos.x + 4.5, pos.y - 9, 4, 16);
  } else if (hairStyle === "bun") {
    ctx.beginPath(); ctx.arc(pos.x, pos.y - 8, 8.5, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(pos.x + flip * 4, pos.y - 16, 4, 0, Math.PI * 2); ctx.fill();
  } else { // shoulder
    ctx.beginPath(); ctx.arc(pos.x, pos.y - 8, 8.5, Math.PI, 0); ctx.fill();
    ctx.fillRect(pos.x - 8, pos.y - 9, 3, 14);
    ctx.fillRect(pos.x + 5, pos.y - 9, 3, 14);
    ctx.beginPath(); ctx.arc(pos.x - 6, pos.y + 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(pos.x + 6, pos.y + 4, 3, 0, Math.PI * 2); ctx.fill();
  }

  // ── Face ──────────────────────────────────────────────────────────────────
  const eyeOff = flip * 2;
  ctx.fillStyle = "#2a1a0a";
  ctx.beginPath(); ctx.arc(pos.x - 2.5 + eyeOff, pos.y - 8, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(pos.x + 2.5 + eyeOff, pos.y - 8, 1.2, 0, Math.PI * 2); ctx.fill();
  // Mouth
  ctx.strokeStyle = "#8a4a2a"; ctx.lineWidth = 1;
  ctx.beginPath();
  if (active) {
    // Focused — slight frown/neutral
    ctx.moveTo(pos.x - 2 + eyeOff, pos.y - 5);
    ctx.lineTo(pos.x + 2 + eyeOff, pos.y - 5);
  } else {
    ctx.arc(pos.x + eyeOff, pos.y - 5, 2.5, 0.1 * Math.PI, 0.9 * Math.PI);
  }
  ctx.stroke();

  // ── Name tag ──────────────────────────────────────────────────────────────
  ctx.font = "bold 7.5px system-ui, sans-serif";
  const tw = ctx.measureText(name).width;
  const tagW = tw + 10, tagH = 11;
  const tagX = pos.x - tagW / 2, tagY = pos.y - 22;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 4;
  ctx.fillStyle = "rgba(10,8,24,0.82)";
  pill(ctx, tagX, tagY, tagW, tagH, 3); ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(name, pos.x, tagY + 8);

  // ── Active glow ring ──────────────────────────────────────────────────────
  if (active) {
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.1 * Math.sin(Date.now() / 400);
    ctx.strokeStyle = accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pos.x, pos.y + 3, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// ── Thought bubble ────────────────────────────────────────────────────────────
function drawThoughtBubble(
  ctx: CanvasRenderingContext2D,
  pos: Position,
  text: string,
  accent: string,
  isDark: boolean,
) {
  const label = text.length > 28 ? text.slice(0, 27) + "…" : text;
  ctx.save();
  ctx.font = "9px system-ui, sans-serif";
  const tw = ctx.measureText(label).width;
  const bw = Math.max(tw + 16, 60), bh = 18;
  const bx = pos.x - bw / 2, by = pos.y - 54;

  // Dot trail
  [[pos.x, pos.y - 24, 2.5], [pos.x - 1, pos.y - 33, 2], [pos.x - 1, pos.y - 41, 1.5]].forEach(([dx, dy, dr]) => {
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";
    ctx.beginPath(); ctx.arc(dx as number, dy as number, dr as number, 0, Math.PI * 2); ctx.fill();
  });

  // Bubble
  ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 8;
  ctx.fillStyle = isDark ? "rgba(14,10,32,0.93)" : "rgba(255,255,255,0.95)";
  pill(ctx, bx, by, bw, bh, 5); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
  pill(ctx, bx, by, bw, bh, 5); ctx.stroke();

  // Text
  ctx.fillStyle = isDark ? "#e8e0f0" : "#1a1028";
  ctx.textAlign = "center";
  ctx.fillText(label, pos.x, by + 12);
  ctx.restore();
}

// ── Colour utilities ──────────────────────────────────────────────────────────
function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(amt * 255));
  const g = Math.min(255, ((n >>  8) & 0xff) + Math.round(amt * 255));
  const b = Math.min(255, ( n        & 0xff) + Math.round(amt * 255));
  return `rgb(${r},${g},${b})`;
}
function isDarker(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, bv = n & 0xff;
  return (0.299 * r + 0.587 * g + 0.114 * bv) < 128;
}

// ── Main component ────────────────────────────────────────────────────────────
export function VirtualOffice() {
  const { data: statusData } = usePolling<AgentStatus>("/api/status", 5000);
  const { data: kanbanData  } = usePolling<KanbanData>("/api/kanban", 15000);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrame    = useRef<number>(0);
  const prevActive   = useRef(false);

  const agentStates = useRef<AgentState[]>(
    AGENTS.map((a, i) => {
      const start = a.name === "Rosé" ? { x: 56, y: 100 }
                  : a.deskIdx >= 0    ? deskSeat(a.deskIdx)
                  : { x: 160 + i * 60, y: 220 };
      return { pos: { ...start }, target: { ...start }, moving: false, stepPhase: 0, facing: "right", wanderTimer: null };
    })
  );

  const scheduleWander = useCallback((idx: number) => {
    const a = agentStates.current[idx];
    if (a.wanderTimer) clearTimeout(a.wanderTimer);
    const delay = 1800 + Math.random() * 3000;
    a.wanderTimer = setTimeout(() => {
      const spots = AGENTS[idx].name === "Rosé" ? BULLPEN_SPOTS : WANDER_SPOTS;
      a.target = { ...spots[Math.floor(Math.random() * spots.length)] };
      a.moving = true;
    }, delay);
  }, []);

  // ── Derive active state ─────────────────────────────────────────────────────
  const jennieActive = statusData?.status === "active";
  const roseActive   = statusData?.roseActive ?? false;
  const agentActive  = [jennieActive, true, false, roseActive]; // Jennie, Lisa, Jisoo, Rosé

  // ── Derive task blurbs ──────────────────────────────────────────────────────
  const tasks = kanbanData?.tasks ?? [];
  // Only show a bubble when there's a real task being worked on — no generic fallbacks
  const agentBlurbs: (string | null)[] = AGENTS.map((a, i) => {
    if (!agentActive[i]) return null;
    const task = tasks.find(t =>
      t.assignee === a.name &&
      t.status === "inProgress" &&
      t.source === "manual" // only manual tasks represent real delegated work
    );
    if (task) return task.title?.trim() || task.description?.slice(0, 30) || null;
    return null;
  });

  // ── Draw ───────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr  = window.devicePixelRatio || 1;
    const cW   = containerRef.current ? containerRef.current.clientWidth - 16 : W;
    const scale = Math.min(1, cW / W);
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${Math.floor(W * scale)}px`;
    canvas.style.height = `${Math.floor(H * scale)}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.fillStyle = isDark ? "#1a1630" : "#f5f0e8";
    ctx.fillRect(0, 0, W, H);

    drawFloor(ctx);
    drawWalls(ctx, isDark);
    drawWhiteboard(ctx, isDark);

    // Plants
    drawPlant(ctx, 574, 32);
    drawPlant(ctx, 574, 310);
    drawPlant(ctx, 18, 48);

    // Coffee station
    drawCoffeeStation(ctx, isDark);

    // Meeting table + rug
    drawMeetingTable(ctx, isDark);

    // Bullpen
    drawBullpen(ctx, roseActive, isDark);

    // Exec desks
    const screenGlows = [
      jennieActive ? "rgba(16,185,129,0.5)" : "rgba(16,185,129,0.12)",
      "rgba(167,139,250,0.35)",
      "rgba(103,232,249,0.25)",
      "rgba(80,80,180,0.15)",
    ];
    DESKS.forEach(([x, y, w, h, label], i) => {
      const glow = i < screenGlows.length ? screenGlows[i] : screenGlows[3];
      drawDesk(ctx, x, y, w, h, label, glow, isDark);
    });

    // Agents
    AGENTS.forEach((def, i) => {
      drawAvatar(ctx, agentStates.current[i], def, agentActive[i]);
    });

    // Thought bubbles (drawn last so they're on top)
    AGENTS.forEach((def, i) => {
      const blurb = agentBlurbs[i];
      if (blurb) drawThoughtBubble(ctx, agentStates.current[i].pos, blurb, def.accent, isDark);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, jennieActive, roseActive, agentBlurbs]);

  // ── Animation loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      agentStates.current.forEach((a, i) => {
        if (!a.moving) return;
        const dx = a.target.x - a.pos.x;
        const dy = a.target.y - a.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1.5) {
          a.pos = { ...a.target };
          a.moving = false;
          scheduleWander(i);
        } else {
          const spd = agentActive[i] ? MOVE_SPEED * 1.6 : MOVE_SPEED;
          a.pos = { x: a.pos.x + (dx / dist) * spd, y: a.pos.y + (dy / dist) * spd };
          if (Math.abs(dx) > 1) a.facing = dx > 0 ? "right" : "left";
        }
        a.stepPhase++;
      });
      draw();
      animFrame.current = requestAnimationFrame(loop);
    };
    animFrame.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw]);

  // Jennie goes to desk when active
  useEffect(() => {
    const a = agentStates.current[0];
    if (jennieActive && !prevActive.current) {
      if (a.wanderTimer) clearTimeout(a.wanderTimer);
      a.target = deskSeat(AGENTS[0].deskIdx);
      a.moving = true;
    } else if (!jennieActive && prevActive.current) {
      scheduleWander(0);
    }
    prevActive.current = jennieActive;
  }, [jennieActive, scheduleWander]);

  // Initial wander
  useEffect(() => {
    agentStates.current.forEach((_, i) => scheduleWander(i));
    return () => agentStates.current.forEach(a => { if (a.wanderTimer) clearTimeout(a.wanderTimer); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Virtual Office</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div ref={containerRef} className="w-full flex justify-center">
          <canvas ref={canvasRef} style={{ maxWidth: "100%", borderRadius: "8px", display: "block" }} />
        </div>
      </CardContent>
    </Card>
  );
}
