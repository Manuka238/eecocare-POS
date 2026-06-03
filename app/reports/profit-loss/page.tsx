import { AppShell } from "@/components/app-shell";
import { ReportsPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Profit / Loss" description="Revenue vs cost overview.">
      <ReportsPage title="Profit / Loss" subtitle="Margin Trend" />
    </AppShell>
  );
}
