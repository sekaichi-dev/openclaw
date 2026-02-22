"use client";

import { AgentsOverviewCard } from "@/components/dashboard/agents-overview-card";
import { CronJobsCard } from "@/components/dashboard/cron-jobs-card";
import { VirtualOffice } from "@/components/dashboard/virtual-office";
import { ActivityFeedCard } from "@/components/dashboard/activity-feed-card";
import { SystemClock } from "@/components/dashboard/system-clock";
import { SystemMetricsCard } from "@/components/dashboard/system-metrics-card";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { AIInsightsCard } from "@/components/dashboard/ai-insights-card";
import { NightModeBanner } from "@/components/dashboard/night-mode-banner";

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
      
      <NightModeBanner />

      {/* Top row: Virtual Office + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <VirtualOffice />
        <QuickActionsCard />
      </div>

      {/* Second row: Activity Feed + AI Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeedCard />
        <AIInsightsCard />
      </div>

      {/* Third row: System Metrics + Agents overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SystemMetricsCard />
        <AgentsOverviewCard />
      </div>

      {/* Fourth row: Cron jobs (full width for better table display) */}
      <CronJobsCard />
    </div>
  );
}
