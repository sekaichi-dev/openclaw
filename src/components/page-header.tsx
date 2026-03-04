"use client";

import { SystemClock } from "@/components/dashboard/system-clock";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        {typeof title === "string" ? (
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        ) : (
          title
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0 pt-0.5">
        {actions}
        <SystemClock />
      </div>
    </div>
  );
}
