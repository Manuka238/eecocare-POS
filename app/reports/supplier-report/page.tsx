import { AppShell } from "@/components/app-shell";
import { ReportsPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Supplier Report" description="Supplier performance and supply volume.">
      <ReportsPage title="Supplier Report" subtitle="Supplier Trend" />
    </AppShell>
  );
}
