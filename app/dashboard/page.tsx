"use client";

import { useState } from "react";
import { PageShell } from "@/components/ui";
import { Sidebar } from "@/components/sidebar";
import { NewDashboardContent } from "@/components/dashboard/dashboard-content";

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <PageShell>
      <div className="flex min-h-screen">
        {mobileOpen && (
          <button
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="min-w-0 flex-1 p-4 md:p-6 xl:p-8">
          <NewDashboardContent onOpenMenu={() => setMobileOpen(true)} />
        </main>
      </div>
    </PageShell>
  );
}
