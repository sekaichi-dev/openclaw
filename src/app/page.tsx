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
import { WorkflowBuilderCard } from "@/components/dashboard/workflow-builder-card";
import { PerformanceMonitorCard } from "@/components/dashboard/performance-monitor-card";
import { BusinessIntelligenceCard } from "@/components/dashboard/business-intelligence-card";
import { AgentNetworkCard } from "@/components/dashboard/agent-network-card";
import { SmartNotificationsCard } from "@/components/dashboard/smart-notifications-card";

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

      {/* Smart Notifications - Priority row for autonomous operations */}
      <SmartNotificationsCard />

      {/* Top row: Virtual Office + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <VirtualOffice />
        <QuickActionsCard />
      </div>

      {/* Second row: Activity Feed + AI Insights + Business Intelligence */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ActivityFeedCard />
        <AIInsightsCard />
        <BusinessIntelligenceCard />
      </div>

      {/* Third row: System Metrics + Agents overview + Agent Network */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SystemMetricsCard />
        <AgentsOverviewCard />
        <AgentNetworkCard />
      </div>

      {/* Fourth row: Workflow Builder (standalone for better space) */}
      <div className="grid gap-6 lg:grid-cols-1">
        <WorkflowBuilderCard />
      </div>

      {/* Fifth row: Performance Monitor (standalone for detailed charts) */}
      <div className="grid gap-6 lg:grid-cols-1">
        <PerformanceMonitorCard />
      </div>

      {/* Sixth row: Cron jobs (full width for better table display) */}
      <CronJobsCard />
    </div>
  );
}
