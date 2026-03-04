"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Brain,
  FolderOpen,
  GitCommitHorizontal,
  Radar,
  AlertCircle,
  Users,
  Home,
  KanbanSquare,
  Workflow,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const businessItems = [
  { href: "/tasks", label: "Tasks", icon: KanbanSquare },
  { href: "/japan-villas", label: "Japan Villas", icon: Home },
];

const agentItems = [
  { href: "/", label: "Virtual Office", icon: LayoutDashboard },
  { href: "/team", label: "Org Chart", icon: Users },
  { href: "/memory", label: "Memory & History", icon: Brain },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/changelog", label: "Changelog", icon: GitCommitHorizontal },
];

function NavSection({
  title,
  icon: SectionIcon,
  items,
  pathname,
  actionCount,
}: {
  title: string;
  icon: React.ElementType;
  items: { href: string; label: string; icon: React.ElementType }[];
  pathname: string;
  actionCount: number;
}) {
  return (
    <div className="space-y-0.5">
      <div className="px-3 pt-1 pb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
          {title}
        </span>
      </div>
      {items.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {href === "/" && actionCount > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-white">
                {actionCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname() ?? "/";
  const [actionCount, setActionCount] = useState(0);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const res = await fetch("/api/actions");
        if (res.ok) {
          const data = await res.json();
          setActionCount(Array.isArray(data) ? data.length : 0);
        }
      } catch {
        // ignore
      }
    };
    fetchActions();
    const interval = setInterval(fetchActions, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
        <Radar className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-bold tracking-tight">Mission Control</h1>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        <NavSection
          title="Business"
          icon={Workflow}
          items={businessItems}
          pathname={pathname}
          actionCount={actionCount}
        />
        <div className="border-t border-border" />
        <NavSection
          title="Agent Management"
          icon={Bot}
          items={agentItems}
          pathname={pathname}
          actionCount={actionCount}
        />
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Localhost only - No auth</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
