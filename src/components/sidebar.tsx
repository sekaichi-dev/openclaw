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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/japan-villas", label: "Japan Villas", icon: Home },
  { href: "/activity", label: "Activity Feed", icon: Activity },
  { href: "/memory", label: "Memory & History", icon: Brain },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/team", label: "Org Chart", icon: Users },
  { href: "/changelog", label: "Changelog", icon: GitCommitHorizontal },
];

export function Sidebar() {
  const pathname = usePathname();
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
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
        <Radar className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-bold tracking-tight">Mission Control</h1>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
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
      </nav>
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Localhost only - No auth</span>
        </div>
      </div>
    </aside>
  );
}
