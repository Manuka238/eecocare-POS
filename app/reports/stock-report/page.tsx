import { AppShell } from "@/components/app-shell";
import { ReportsPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Stock Report" description="Stock movement and inventory chart.">
      <ReportsPage title="Stock Report" subtitle="Inventory Movement" />
    </AppShell>
  );
}
