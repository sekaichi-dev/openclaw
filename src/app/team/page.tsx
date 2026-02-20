"use client";

import { usePolling } from "@/hooks/use-polling";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface Human {
  name: string;
  role: string;
  slack: string;
  focus: string;
  department: string;
  reportsTo: string | null;
  note?: string;
  avatar: string;
}

interface Agent {
  name: string;
  role: string;
  model: string;
  focus: string;
  channels: string[];
  avatar: string;
  status: string;
  reportsTo: string;
}

interface Department {
  id: string;
  name: string;
  color: string;
}

interface TeamData {
  humans: Human[];
  agents: Agent[];
  departments: Department[];
}

export default function TeamPage() {
  const { data, loading } = usePolling<TeamData>("/api/team", 60000);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  const humans = data?.humans || [];
  const agents = data?.agents || [];
  const departments = data?.departments || [];

  const getDeptColor = (deptId: string) =>
    departments.find((d) => d.id === deptId)?.color || "#6b7280";

  const getDeptName = (deptId: string) =>
    departments.find((d) => d.id === deptId)?.name || deptId;

  const selected = humans.find((h) => h.name === selectedPerson) || null;
  const selectedAgent = agents.find((a) => a.name === selectedPerson) || null;

  const select = (name: string) =>
    setSelectedPerson(selectedPerson === name ? null : name);

  const getReports = (name: string) =>
    humans.filter((h) => h.reportsTo === name);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Org Chart</h2>
          <p className="text-muted-foreground">Sekaichi, Inc. team</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  // Layer 3 heads with their reports
  const layer3 = [
    {
      person: humans.find((h) => h.name === "Jiro")!,
      reports: [
        humans.find((h) => h.name === "Saki Ishihara"),
      ].filter(Boolean) as Human[],
    },
    {
      person: humans.find((h) => h.name === "Yoshito Honma")!,
      reports: getReports("Yoshito Honma"),
    },
    {
      person: humans.find((h) => h.name === "Ryoya Hironaka")!,
      reports: [],
    },
    {
      person: humans.find((h) => h.name === "Kohei Ogawa")!,
      reports: getReports("Kohei Ogawa"),
    },
  ].filter((b) => b.person);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Org Chart</h2>
        <p className="text-muted-foreground">
          Sekaichi, Inc. — humans & AI agents
        </p>
      </div>

      <div className="space-y-2">
        {/* Layer 1: CEO */}
        <div className="flex justify-center">
          <PersonCard
            name="Tenichi Liu"
            role="Founder & CEO"
            avatar="👤"
            deptColor={getDeptColor("leadership")}
            deptName="CEO"
            isSelected={selectedPerson === "Tenichi Liu"}
            onClick={() => select("Tenichi Liu")}
          />
        </div>

        <Connector />

        {/* Layer 2: Jennie only */}
        <div className="flex justify-center">
          <PersonCard
            name="Jennie"
            role="AI Teammate"
            avatar="🐾"
            deptColor="#10b981"
            deptName="AI Agent"
            subtitle="Claude Opus 4"
            isAgent
            isSelected={selectedPerson === "Jennie"}
            onClick={() => select("Jennie")}
          />
        </div>

        <Connector />

        {/* Layer 3: Jiro, Yoshito, Ryoya, Kohei */}
        <div className="flex justify-center gap-4 flex-wrap">
          {layer3.map(({ person, reports }) => (
            <div key={person.name} className="space-y-2">
              <PersonCard
                name={person.name}
                role={person.role}
                avatar={person.avatar}
                deptColor={getDeptColor(person.department)}
                deptName={getDeptName(person.department)}
                note={person.note}
                isSelected={selectedPerson === person.name}
                onClick={() => select(person.name)}
              />
              {/* Layer 4: Reports */}
              {reports.length > 0 && (
                <div className="ml-6 space-y-2">
                  <div className="ml-2 h-3 w-px bg-border" />
                  {reports.map((r) => (
                    <div key={r.name}>
                      <div className="ml-2 h-2 w-px bg-border" />
                      <PersonCard
                        name={r.name}
                        role={r.role}
                        avatar={r.avatar}
                        deptColor={getDeptColor(r.department)}
                        deptName={getDeptName(r.department)}
                        compact
                        note={r.note}
                        isSelected={selectedPerson === r.name}
                        onClick={() => select(r.name)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {(selected || selectedAgent) && (
        <Card className="border-border/50 bg-card/50 backdrop-blur mt-6">
          <CardContent className="p-6">
            {selected && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selected.avatar}</span>
                  <div>
                    <h3 className="text-lg font-bold">{selected.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selected.role}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: getDeptColor(selected.department) + "50",
                      color: getDeptColor(selected.department),
                      backgroundColor:
                        getDeptColor(selected.department) + "15",
                    }}
                  >
                    {getDeptName(selected.department)}
                  </Badge>
                </div>
                <div className="grid gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Slack: </span>
                    <span className="font-mono">{selected.slack}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reports to: </span>
                    <span>{selected.reportsTo || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Focus: </span>
                    <span>{selected.focus}</span>
                  </div>
                  {selected.note && (
                    <div>
                      <span className="text-muted-foreground">Note: </span>
                      <span className="text-amber-400">{selected.note}</span>
                    </div>
                  )}
                  {getReports(selected.name).length > 0 && (
                    <div>
                      <span className="text-muted-foreground">
                        Direct reports:{" "}
                      </span>
                      <span>
                        {getReports(selected.name)
                          .map((r) => r.name)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedAgent && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedAgent.avatar}</span>
                  <div>
                    <h3 className="text-lg font-bold">{selectedAgent.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedAgent.role}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  >
                    AI Agent
                  </Badge>
                </div>
                <div className="grid gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Model: </span>
                    <span className="font-mono">{selectedAgent.model}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reports to: </span>
                    <span>{selectedAgent.reportsTo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Focus: </span>
                    <span>{selectedAgent.focus}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Channels: </span>
                    <span>{selectedAgent.channels.join(", ")}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Connector() {
  return (
    <div className="flex justify-center py-1">
      <div className="h-6 w-px bg-border" />
    </div>
  );
}

function PersonCard({
  name,
  role,
  avatar,
  deptColor,
  deptName,
  subtitle,
  note,
  isAgent,
  compact,
  isSelected,
  onClick,
}: {
  name: string;
  role: string;
  avatar: string;
  deptColor: string;
  deptName: string;
  subtitle?: string;
  note?: string;
  isAgent?: boolean;
  compact?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:bg-muted/30 ${
        isSelected ? "ring-1 ring-white/20 bg-muted/20" : ""
      } ${isAgent ? "border-emerald-500/30" : ""} ${compact ? "w-48" : "w-52"}`}
      onClick={onClick}
    >
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center rounded-full shrink-0 ${compact ? "h-8 w-8 text-sm" : "h-10 w-10 text-lg"}`}
            style={{ backgroundColor: deptColor + "20" }}
          >
            {isAgent ? "🐾" : avatar}
          </div>
          <div className="min-w-0">
            <p
              className={`font-medium truncate ${compact ? "text-xs" : "text-sm"}`}
            >
              {name}
            </p>
            <p
              className={`text-muted-foreground truncate ${compact ? "text-[10px]" : "text-xs"}`}
            >
              {subtitle || role}
            </p>
          </div>
        </div>
        {!compact && (
          <div className="mt-2 flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="text-[10px]"
              style={{
                borderColor: deptColor + "40",
                color: deptColor,
                backgroundColor: deptColor + "10",
              }}
            >
              {deptName}
            </Badge>
            {isAgent && (
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              >
                Online
              </Badge>
            )}
          </div>
        )}
        {note && !compact && (
          <p className="mt-1.5 text-[10px] text-amber-400/70 truncate">
            {note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
