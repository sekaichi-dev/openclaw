import { Suspense } from "react";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <div className="border-r bg-background p-6 w-64">
        {/* Sidebar content */}
      </div>
      <main className="flex-1 p-6">
        <Suspense fallback={<div>Loading...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
