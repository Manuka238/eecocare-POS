import { AppShell } from "@/components/app-shell";
import { ReportsPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Customer Report" description="Customer order behavior and growth.">
      <ReportsPage title="Customer Report" subtitle="Customer Trend" />
    </AppShell>
  );
}
