import { AppShell } from "@/components/app-shell";
import { ReportsPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Purchase Report" description="Purchase analytics and totals.">
      <ReportsPage title="Purchase Report" subtitle="Purchase Trend" />
    </AppShell>
  );
}
