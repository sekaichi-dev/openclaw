"use client";

import { AgentsOverviewCard } from "@/components/dashboard/agents-overview-card";
import { ActivityFeedCard } from "@/components/dashboard/activity-feed-card";
import { VirtualOffice } from "@/components/dashboard/virtual-office";
import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Virtual Office" subtitle="Your autonomous company at a glance" />

      {/* Virtual Office — top, full width */}
      <VirtualOffice />

      {/* Agents Overview */}
      <AgentsOverviewCard />

      {/* Activity Feed */}
      <ActivityFeedCard />
    </div>
  );
}
