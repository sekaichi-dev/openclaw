"use client";

import { AgentsOverviewCard } from "@/components/dashboard/agents-overview-card";
import { CronJobsCard } from "@/components/dashboard/cron-jobs-card";
import { VirtualOffice } from "@/components/dashboard/virtual-office";
import { ActivityFeedCard } from "@/components/dashboard/activity-feed-card";
import { SystemClock } from "@/components/dashboard/system-clock";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your OpenClaw agent system.
        </p>
      </div>

      <SystemClock />

      {/* Top row: Virtual Office + Activity Feed side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <VirtualOffice />
        <ActivityFeedCard />
      </div>

      {/* Agents overview + Cron jobs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AgentsOverviewCard />
        <CronJobsCard />
      </div>
    </div>
  );
}
