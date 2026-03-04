"use client";

import { AgentsOverviewCard } from "@/components/dashboard/agents-overview-card";
import { ActivityFeedCard } from "@/components/dashboard/activity-feed-card";
import { VirtualOffice } from "@/components/dashboard/virtual-office";
import { PerformanceMetricsCard } from "@/components/dashboard/performance-metrics-card";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <div className="space-y-5">

      <PageHeader title="Virtual Office" subtitle="Your autonomous company at a glance" />

      {/* Agents Overview + Notifications — full width */}
      <AgentsOverviewCard />

      {/* Virtual Office (left) + Performance + Quick Actions (right) — responsive layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <VirtualOffice />
        </div>
        <div className="space-y-5 lg:col-span-2 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
          <PerformanceMetricsCard />
          <QuickActionsCard />
        </div>
      </div>

      {/* Activity Feed — full width */}
      <ActivityFeedCard />

    </div>
  );
}
