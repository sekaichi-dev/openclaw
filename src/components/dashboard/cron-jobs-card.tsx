"use client";

import { useState, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePolling } from "@/hooks/use-polling";
import { Timer, ChevronDown, ChevronRight } from "lucide-react";

interface CronJob {
  id?: string;
  name: string;
  schedule: string | { kind?: string; expr?: string; tz?: string };
  scheduleHuman?: string;
  nextRun?: string;
  lastRun?: string;
  lastStatus?: string;
  frequency?: string;
  payload?: unknown;
  description?: string;
  enabled?: boolean;
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
    consecutiveErrors?: number;
  };
}

const FILTERS = ["All", "Daily", "Weekly", "Monthly"] as const;

function getScheduleDisplay(job: CronJob): string {
  if (job.scheduleHuman) return job.scheduleHuman;
  if (typeof job.schedule === "object" && job.schedule.expr) {
    return `${job.schedule.expr}${job.schedule.tz ? ` (${job.schedule.tz})` : ""}`;
  }
  return String(job.schedule);
}

function getFrequency(job: CronJob): string {
  const expr =
    typeof job.schedule === "object" ? job.schedule.expr || "" : String(job.schedule);
  if (job.frequency) return job.frequency.toLowerCase();
  // Simple heuristic from cron expression
  if (expr.includes("* * *")) return "daily";
  if (expr.includes("* *") && !expr.includes("* * *")) return "weekly";
  return "daily";
}

export function CronJobsCard() {
  const { data: jobs, loading } = usePolling<CronJob[]>("/api/cron");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const filteredJobs = (jobs || []).filter((job) => {
    if (filter === "All") return true;
    const freq = getFrequency(job);
    return freq.includes(filter.toLowerCase());
  });

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const s = status.toLowerCase();
    if (s === "success" || s === "ok")
      return (
        <Badge
          variant="outline"
          className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-1 py-0"
        >
          OK
        </Badge>
      );
    if (s === "error" || s === "failed")
      return (
        <Badge
          variant="outline"
          className="bg-red-500/20 text-red-400 border-red-500/30 text-xs px-1 py-0"
        >
          Err
        </Badge>
      );
    if (s === "running")
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs px-1 py-0"
        >
          Run
        </Badge>
      );
    return <Badge variant="outline" className="text-xs px-1 py-0">{status.slice(0, 3)}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">
            Scheduled Cron Jobs
          </CardTitle>
          {jobs && (
            <Badge variant="secondary" className="ml-1">
              {jobs.length}
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f}
              variant={filter === f ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {jobs?.length === 0
              ? "No cron jobs configured."
              : "No jobs match the selected filter."}
          </div>
        ) : (
          <div className="overflow-x-auto max-w-full">
            <Table className="table-fixed w-full">
              <TableHeader>
              <TableRow>
                <TableHead className="w-6" />
                <TableHead className="w-[140px]">Name</TableHead>
                <TableHead className="w-[110px]">Next</TableHead>
                <TableHead className="w-[110px]">Last</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => {
                const key = job.id || job.name;
                const isExpanded = expandedJob === key;
                const nextRun = job.state?.nextRunAtMs
                  ? new Date(job.state.nextRunAtMs).toLocaleString()
                  : job.nextRun
                    ? new Date(job.nextRun).toLocaleString()
                    : "—";
                const lastRun = job.state?.lastRunAtMs
                  ? new Date(job.state.lastRunAtMs).toLocaleString()
                  : job.lastRun
                    ? new Date(job.lastRun).toLocaleString()
                    : "—";
                const status = job.state?.lastStatus || job.lastStatus;

                return (
                  <Fragment key={key}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedJob(isExpanded ? null : key)}
                    >
                      <TableCell className="w-6 pr-0">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium w-[140px] overflow-hidden">
                        <div className="truncate" title={job.name || "Unnamed"}>
                          {job.name || "Unnamed"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs w-[110px] overflow-hidden">
                        <div className="truncate" title={nextRun}>
                          {nextRun}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs w-[110px] overflow-hidden">
                        <div className="truncate" title={lastRun}>
                          {lastRun}
                        </div>
                      </TableCell>
                      <TableCell className="w-[80px]">{getStatusBadge(status)}</TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/30 p-4">
                          <div className="space-y-2 text-sm">
                            {job.description && (
                              <p className="text-muted-foreground break-words">
                                {job.description}
                              </p>
                            )}
                            {job.enabled !== undefined && (
                              <p>
                                Enabled:{" "}
                                <Badge variant={job.enabled ? "default" : "destructive"}>
                                  {job.enabled ? "Yes" : "No"}
                                </Badge>
                              </p>
                            )}
                            <div className="font-mono text-xs break-all">
                              <strong>Schedule:</strong> {getScheduleDisplay(job)}
                            </div>
                            {job.state?.lastDurationMs != null && (
                              <p className="text-xs text-muted-foreground">
                                Last duration: {(job.state.lastDurationMs / 1000).toFixed(1)}s
                              </p>
                            )}
                            {job.payload != null && (
                              <div className="mt-2">
                                <strong className="text-xs">Payload:</strong>
                                <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-x-auto max-h-40 whitespace-pre-wrap break-words">
                                  {typeof job.payload === "object"
                                    ? JSON.stringify(job.payload, null, 2)
                                    : String(job.payload)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
