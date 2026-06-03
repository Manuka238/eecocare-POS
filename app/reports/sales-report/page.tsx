import { AppShell } from "@/components/app-shell";
import { ReportsPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Sales Report" description="Sales performance with charts and KPIs.">
      <ReportsPage title="Sales Report" subtitle="Sales Orders Trend" />
    </AppShell>
  );
}
