"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyMemoryTab } from "@/components/memory/daily-memory-tab";
import { SessionHistoryTab } from "@/components/memory/session-history-tab";
import { MorningBriefsTab } from "@/components/memory/morning-briefs-tab";

export default function MemoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Memory & History
        </h2>
        <p className="text-muted-foreground">
          Browse daily memory logs, session history, and morning briefs.
        </p>
      </div>

      <Tabs defaultValue="memory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="memory">Daily Memory</TabsTrigger>
          <TabsTrigger value="sessions">Session History</TabsTrigger>
          <TabsTrigger value="briefs">Morning Briefs</TabsTrigger>
        </TabsList>

        <TabsContent value="memory">
          <DailyMemoryTab />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionHistoryTab />
        </TabsContent>

        <TabsContent value="briefs">
          <MorningBriefsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
