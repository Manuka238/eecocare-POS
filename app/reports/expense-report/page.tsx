import { AppShell } from "@/components/app-shell";
import { ReportsPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Expense Report" description="Expense totals and category trend.">
      <ReportsPage title="Expense Report" subtitle="Expense Trend" />
    </AppShell>
  );
}
