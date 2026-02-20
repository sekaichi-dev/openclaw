"use client";

import { useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { usePolling } from "@/hooks/use-polling";

interface AgentStatus {
  agent: string;
  status: string;
  model: string;
  lastActivity: string | null;
  roseActive?: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface AgentDef {
  name: string;
  role: string;
  activeColor: string;
  idleColor: string;
  glowActive: string;
  glowIdle: string;
  deskIdx: number;
}

const AGENTS_DEF: AgentDef[] = [
  {
    name: "Jennie",
    role: "AI Teammate",
    activeColor: "#10b981",
    idleColor: "#f59e0b",
    glowActive: "rgba(16, 185, 129, 0.2)",
    glowIdle: "rgba(245, 158, 11, 0.15)",
    deskIdx: 0,
  },
  {
    name: "Lisa",
    role: "Villa Concierge",
    activeColor: "#a78bfa",
    idleColor: "#8b5cf6",
    glowActive: "rgba(167, 139, 250, 0.25)",
    glowIdle: "rgba(139, 92, 246, 0.15)",
    deskIdx: 1,
  },
  {
    name: "Rosé",
    role: "Coding Agent",
    activeColor: "#f472b6",
    idleColor: "#f472b6",
    glowActive: "rgba(244, 114, 182, 0.25)",
    glowIdle: "rgba(244, 114, 182, 0.15)",
    deskIdx: -1, // no permanent desk — spawned on demand
  },
];

// Office layout constants
const OFFICE = {
  width: 480,
  height: 320,
  wanderBounds: { minX: 40, maxX: 440, minY: 40, maxY: 280 },
  furniture: [
    // Executive desks
    { type: "desk" as const, x: 300, y: 120, w: 80, h: 50, label: "Jennie" },
    { type: "desk" as const, x: 300, y: 200, w: 80, h: 50, label: "Lisa" },
    { type: "desk" as const, x: 140, y: 120, w: 80, h: 50, label: "" },
    { type: "desk" as const, x: 140, y: 200, w: 80, h: 50, label: "" },
    
    // Coding bullpen (left side)
    { type: "bullpen" as const, x: 40, y: 60, w: 80, h: 120, label: "Dev Bullpen" },
    { type: "workstation" as const, x: 45, y: 70, w: 25, h: 20, label: "" },
    { type: "workstation" as const, x: 75, y: 70, w: 25, h: 20, label: "" },
    { type: "workstation" as const, x: 45, y: 100, w: 25, h: 20, label: "" },
    { type: "workstation" as const, x: 75, y: 100, w: 25, h: 20, label: "" },
    { type: "workstation" as const, x: 45, y: 130, w: 25, h: 20, label: "" },
    { type: "workstation" as const, x: 75, y: 130, w: 25, h: 20, label: "" },
    
    // Meeting/collab area
    { type: "table" as const, x: 40, y: 240, w: 60, h: 40, label: "" },
    { type: "plant" as const, x: 450, y: 20, w: 16, h: 16, label: "" },
    { type: "plant" as const, x: 20, y: 280, w: 16, h: 16, label: "" },
    { type: "plant" as const, x: 450, y: 280, w: 16, h: 16, label: "" },
    { type: "coffee" as const, x: 20, y: 200, w: 20, h: 30, label: "" },
    { type: "whiteboard" as const, x: 160, y: 10, w: 100, h: 12, label: "" },
  ],
};

const AGENT_SIZE = 20;
const MOVE_SPEED = 0.8;
const WANDER_PAUSE_MIN = 1500;
const WANDER_PAUSE_MAX = 4000;

interface AgentState {
  pos: Position;
  target: Position;
  moving: boolean;
  stepPhase: number;
  facing: "left" | "right";
  wanderTimer: NodeJS.Timeout | null;
}

function getDeskSeatPos(deskIdx: number): Position {
  const desk = OFFICE.furniture[deskIdx];
  return { x: desk.x + desk.w / 2, y: desk.y + desk.h + 12 };
}

export function VirtualOffice() {
  const { data } = usePolling<AgentStatus>("/api/status", 5000);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrame = useRef<number>(0);
  const prevStatus = useRef<string>("standby");

  // Agent states
  const agents = useRef<AgentState[]>(
    AGENTS_DEF.map((def, i) => {
      // Rosé starts in the bullpen, others in general positions
      const startPos = def.name === "Rosé" ? 
        { x: 57, y: 85 } : 
        { x: 150 + i * 120, y: 200 };
      
      return {
        pos: startPos,
        target: startPos,
        moving: false,
        stepPhase: 0,
        facing: "right" as const,
        wanderTimer: null,
      };
    })
  );

  const isActive = data?.status === "active";
  const roseActive = data?.roseActive ?? false;

  const pickWanderTarget = useCallback((agentName?: string) => {
    if (agentName === "Rosé") {
      // Rosé stays in the coding bullpen area
      const bullpenSpots = [
        { x: 57, y: 85 },   // workstation 1
        { x: 87, y: 85 },   // workstation 2  
        { x: 57, y: 115 },  // workstation 3
        { x: 87, y: 115 },  // workstation 4
        { x: 57, y: 145 },  // workstation 5
        { x: 87, y: 145 },  // workstation 6
        { x: 210, y: 30 },  // whiteboard (collaboration)
        { x: 30, y: 215 },  // coffee run
      ];
      return bullpenSpots[Math.floor(Math.random() * bullpenSpots.length)];
    }
    
    // General wandering for Jennie and Lisa
    const b = OFFICE.wanderBounds;
    const spots = [
      { x: 50, y: 250 },
      { x: 200, y: 50 },
      { x: 70, y: 260 },
      { x: 100 + Math.random() * 100, y: 160 + Math.random() * 40 },
      { x: 200 + Math.random() * 100, y: 80 + Math.random() * 40 },
      { x: 420, y: 100 + Math.random() * 100 },
      { x: b.minX + Math.random() * (b.maxX - b.minX), y: b.minY + Math.random() * (b.maxY - b.minY) },
    ];
    return spots[Math.floor(Math.random() * spots.length)];
  }, []);

  const scheduleWander = useCallback((idx: number) => {
    const a = agents.current[idx];
    const agentName = AGENTS_DEF[idx]?.name;
    if (a.wanderTimer) clearTimeout(a.wanderTimer);
    const delay = WANDER_PAUSE_MIN + Math.random() * (WANDER_PAUSE_MAX - WANDER_PAUSE_MIN);
    a.wanderTimer = setTimeout(() => {
      a.target = pickWanderTarget(agentName);
      a.moving = true;
    }, delay);
  }, [pickWanderTarget]);

  const drawAgent = useCallback((ctx: CanvasRenderingContext2D, agentState: AgentState, def: AgentDef, active: boolean, opacity: number = 1) => {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    const pos = agentState.pos;
    const color = active ? def.activeColor : def.idleColor;
    const glow = active ? def.glowActive : def.glowIdle;

    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + AGENT_SIZE / 2 + 2, AGENT_SIZE / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, AGENT_SIZE, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, AGENT_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Face
    const faceX = agentState.facing === "right" ? 2 : -2;
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.arc(pos.x + faceX - 3, pos.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pos.x + faceX + 3, pos.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (active) {
      ctx.arc(pos.x + faceX, pos.y + 2, 3, 0.1 * Math.PI, 0.9 * Math.PI);
    } else {
      ctx.moveTo(pos.x + faceX - 2, pos.y + 3);
      ctx.lineTo(pos.x + faceX + 2, pos.y + 3);
    }
    ctx.stroke();

    // Walking feet
    if (agentState.moving) {
      const step = Math.floor(agentState.stepPhase / 8) % 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x - 4 + (step ? 2 : 0), pos.y + AGENT_SIZE / 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pos.x + 4 - (step ? 2 : 0), pos.y + AGENT_SIZE / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Name tag
    const nameWidth = Math.max(ctx.measureText(def.name).width + 12, 36);
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    roundRect(ctx, pos.x - nameWidth / 2, pos.y - AGENT_SIZE / 2 - 16, nameWidth, 13, 3);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(def.name, pos.x, pos.y - AGENT_SIZE / 2 - 6);

    // Status dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x + nameWidth / 2 - 3, pos.y - AGENT_SIZE / 2 - 10, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, []);

  // Draw the office
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const container = containerRef.current;
    const containerWidth = container ? container.clientWidth - 16 : OFFICE.width;
    const scale = Math.min(1, containerWidth / OFFICE.width);
    const w = OFFICE.width;
    const h = OFFICE.height;
    const displayW = Math.floor(w * scale);
    const displayH = Math.floor(h * scale);

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Floor
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, w, h);

    // Floor grid
    ctx.strokeStyle = "#1f1f3a";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Walls
    ctx.strokeStyle = "#3a3a5c";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // Windows
    ctx.fillStyle = "#1e3a5f";
    ctx.fillRect(w - 4, 60, 4, 80);
    ctx.fillRect(w - 4, 180, 4, 80);
    ctx.fillStyle = "rgba(100, 180, 255, 0.05)";
    ctx.fillRect(w - 40, 60, 40, 80);
    ctx.fillRect(w - 40, 180, 40, 80);

    // Door
    ctx.fillStyle = "#2a2a4a";
    ctx.fillRect(0, 100, 4, 40);
    ctx.fillStyle = "#4a4a6a";
    ctx.fillRect(0, 115, 4, 10);

    // Furniture
    OFFICE.furniture.forEach((f) => {
      switch (f.type) {
        case "desk":
          ctx.fillStyle = "#2d2d4a";
          ctx.fillRect(f.x, f.y, f.w, f.h);
          ctx.strokeStyle = "#3d3d5a";
          ctx.lineWidth = 1;
          ctx.strokeRect(f.x, f.y, f.w, f.h);
          ctx.fillStyle = "#0f0f2a";
          ctx.fillRect(f.x + f.w / 2 - 10, f.y + 5, 20, 14);
          // Screen glow based on agent
          const agentDef = AGENTS_DEF.find(a => a.name === f.label);
          if (agentDef && f.label === "Jennie" && isActive) {
            ctx.fillStyle = "rgba(16, 185, 129, 0.4)";
          } else if (agentDef && f.label === "Lisa") {
            // Lisa is always "on" (concierge always ready)
            ctx.fillStyle = "rgba(167, 139, 250, 0.3)";
          } else {
            ctx.fillStyle = "rgba(100, 100, 180, 0.15)";
          }
          ctx.fillRect(f.x + f.w / 2 - 9, f.y + 6, 18, 12);
          // Chair
          ctx.fillStyle = "#2a2a48";
          ctx.beginPath();
          ctx.arc(f.x + f.w / 2, f.y + f.h + 12, 8, 0, Math.PI * 2);
          ctx.fill();
          if (f.label) {
            ctx.fillStyle = "#6a6a9a";
            ctx.font = "9px monospace";
            ctx.textAlign = "center";
            ctx.fillText(f.label, f.x + f.w / 2, f.y - 4);
          }
          break;
        case "table":
          ctx.fillStyle = "#2a2a48";
          roundRect(ctx, f.x, f.y, f.w, f.h, 6);
          ctx.fill();
          ctx.strokeStyle = "#3a3a58";
          ctx.lineWidth = 1;
          roundRect(ctx, f.x, f.y, f.w, f.h, 6);
          ctx.stroke();
          [{ x: f.x - 8, y: f.y + f.h / 2 }, { x: f.x + f.w + 8, y: f.y + f.h / 2 }, { x: f.x + f.w / 2, y: f.y - 8 }, { x: f.x + f.w / 2, y: f.y + f.h + 8 }].forEach((c) => {
            ctx.fillStyle = "#2a2a48";
            ctx.beginPath();
            ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
            ctx.fill();
          });
          break;
        case "plant":
          ctx.fillStyle = "#3a2a1a";
          ctx.fillRect(f.x - 2, f.y + 6, f.w + 4, 10);
          ctx.fillStyle = "#1a5a2a";
          ctx.beginPath();
          ctx.arc(f.x + f.w / 2, f.y + 4, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#2a7a3a";
          ctx.beginPath();
          ctx.arc(f.x + f.w / 2 - 3, f.y + 2, 5, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "coffee":
          ctx.fillStyle = "#2a2a3a";
          ctx.fillRect(f.x, f.y, f.w, f.h);
          ctx.strokeStyle = "#3a3a4a";
          ctx.lineWidth = 1;
          ctx.strokeRect(f.x, f.y, f.w, f.h);
          ctx.fillStyle = "#6a4a2a";
          ctx.fillRect(f.x + 5, f.y + 5, 10, 8);
          ctx.strokeStyle = "rgba(200, 200, 200, 0.2)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(f.x + 8, f.y + 2);
          ctx.quadraticCurveTo(f.x + 6, f.y - 3, f.x + 10, f.y - 5);
          ctx.stroke();
          break;
        case "whiteboard":
          ctx.fillStyle = "#2a2a4a";
          ctx.fillRect(f.x, f.y, f.w, f.h);
          ctx.strokeStyle = "#4a4a6a";
          ctx.lineWidth = 1;
          ctx.strokeRect(f.x, f.y, f.w, f.h);
          ctx.strokeStyle = "rgba(255, 100, 100, 0.3)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(f.x + 10, f.y + 4);
          ctx.lineTo(f.x + 40, f.y + 4);
          ctx.stroke();
          ctx.strokeStyle = "rgba(100, 200, 255, 0.3)";
          ctx.beginPath();
          ctx.moveTo(f.x + 10, f.y + 8);
          ctx.lineTo(f.x + 60, f.y + 8);
          ctx.stroke();
          break;
        case "bullpen":
          // Bullpen background
          ctx.fillStyle = "#1f1f3a";
          ctx.fillRect(f.x, f.y, f.w, f.h);
          ctx.strokeStyle = "#3a3a5c";
          ctx.lineWidth = 1;
          ctx.strokeRect(f.x, f.y, f.w, f.h);
          // Label
          if (f.label) {
            ctx.fillStyle = "#6a6a9a";
            ctx.font = "8px monospace";
            ctx.textAlign = "center";
            ctx.fillText(f.label, f.x + f.w / 2, f.y - 4);
          }
          break;
        case "workstation":
          // Workstation desk
          ctx.fillStyle = "#2d2d4a";
          ctx.fillRect(f.x, f.y, f.w, f.h);
          ctx.strokeStyle = "#3d3d5a";
          ctx.lineWidth = 1;
          ctx.strokeRect(f.x, f.y, f.w, f.h);
          // Monitor
          ctx.fillStyle = "#0f0f2a";
          ctx.fillRect(f.x + f.w / 2 - 5, f.y + 2, 10, 8);
          // Monitor glow (bright pink when Rosé is coding, dim pink when available)
          if (roseActive) {
            ctx.fillStyle = "rgba(244, 114, 182, 0.4)";
          } else {
            ctx.fillStyle = "rgba(244, 114, 182, 0.15)";
          }
          ctx.fillRect(f.x + f.w / 2 - 4, f.y + 3, 8, 6);
          // Chair
          ctx.fillStyle = "#2a2a48";
          ctx.beginPath();
          ctx.arc(f.x + f.w / 2, f.y + f.h + 5, 4, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    });

    // Draw all agents
    ctx.font = "bold 8px monospace";
    AGENTS_DEF.forEach((def, i) => {
      if (def.name === "Rosé") {
        // Always visible, but active state changes based on coding work
        drawAgent(ctx, agents.current[i], def, roseActive, 1);
      } else {
        const agentActive = def.name === "Jennie" ? isActive : false;
        drawAgent(ctx, agents.current[i], def, agentActive);
      }
    });
  }, [isActive, roseActive, drawAgent]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      agents.current.forEach((a, i) => {
        const def = AGENTS_DEF[i];

        if (a.moving) {
          const dx = a.target.x - a.pos.x;
          const dy = a.target.y - a.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 2) {
            a.pos = { ...a.target };
            a.moving = false;
            const jennieAndActive = def.name === "Jennie" && isActive;
            // Rosé moves less frequently when idle, more when coding
            const shouldSchedule = def.name === "Rosé" ? 
              (roseActive || Math.random() < 0.3) : // 30% chance when idle, always when active
              !jennieAndActive;
            if (shouldSchedule) {
              scheduleWander(i);
            }
          } else {
            const speed = (def.name === "Jennie" && isActive) ? MOVE_SPEED * 2 :
                          (def.name === "Rosé" && roseActive) ? MOVE_SPEED * 1.5 : MOVE_SPEED;
            a.pos = {
              x: a.pos.x + (dx / dist) * speed,
              y: a.pos.y + (dy / dist) * speed,
            };
            if (Math.abs(dx) > 1) {
              a.facing = dx > 0 ? "right" : "left";
            }
          }
          a.stepPhase++;
        }
      });

      draw();
      animFrame.current = requestAnimationFrame(animate);
    };

    animFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame.current);
  }, [draw, isActive, scheduleWander]);

  // Rosé activity level changes based on sub-agent work
  useEffect(() => {
    const roseIdx = AGENTS_DEF.findIndex(a => a.name === "Rosé");
    if (roseIdx < 0) return;
    const rose = agents.current[roseIdx];
    
    if (roseActive) {
      // When coding starts, move more frequently and stay closer to workstations
      if (rose.wanderTimer) clearTimeout(rose.wanderTimer);
      scheduleWander(roseIdx);
    }
    // When not coding, she just idles at current position with occasional movement
  }, [roseActive, scheduleWander]);

  // Jennie reacts to status changes
  useEffect(() => {
    const jennie = agents.current[0];
    if (isActive) {
      if (jennie.wanderTimer) clearTimeout(jennie.wanderTimer);
      const seat = getDeskSeatPos(AGENTS_DEF[0].deskIdx);
      jennie.target = seat;
      jennie.moving = true;
    } else if (prevStatus.current === "active") {
      scheduleWander(0);
    } else if (prevStatus.current === "standby") {
      if (!jennie.moving) scheduleWander(0);
    }
    prevStatus.current = data?.status || "standby";
  }, [isActive, data?.status, scheduleWander]);

  // Initial wander for all agents
  useEffect(() => {
    agents.current.forEach((a, i) => {
      const def = AGENTS_DEF[i];
      const jennieAndActive = def.name === "Jennie" && isActive;
      const roseIdle = def.name === "Rosé" && !roseActive;
      
      if (!jennieAndActive && !(roseIdle && Math.random() < 0.7)) {
        // Rosé has 70% chance to stay put when idle
        scheduleWander(i);
      }
    });
    return () => {
      agents.current.forEach((a) => {
        if (a.wanderTimer) clearTimeout(a.wanderTimer);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Virtual Office</CardTitle>
        </div>
        <div className="flex gap-2">
          {AGENTS_DEF.map((def) => {
            const active = def.name === "Jennie" ? isActive : def.name === "Rosé" ? roseActive : false;
            const badgeClass = active
              ? def.name === "Rosé"
                ? "bg-pink-500/20 text-pink-400 border-pink-500/30"
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : def.name === "Lisa"
              ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
              : def.name === "Rosé"
              ? "bg-pink-500/10 text-pink-300 border-pink-500/20"
              : "bg-amber-500/20 text-amber-400 border-amber-500/30";
            const dotClass = active
              ? def.name === "Rosé"
                ? "bg-pink-400 animate-pulse"
                : "bg-emerald-400 animate-pulse"
              : def.name === "Lisa" 
              ? "bg-violet-400" 
              : def.name === "Rosé"
              ? "bg-pink-300"
              : "bg-amber-400";
            return (
              <Badge key={def.name} variant="outline" className={badgeClass}>
                <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${dotClass}`} />
                {def.name}
              </Badge>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div ref={containerRef} className="w-full flex justify-center">
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: "100%",
              borderRadius: "8px",
              display: "block",
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
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
