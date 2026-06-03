import { AppShell } from "@/components/app-shell";
import { ExpenseListPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Expense List" description="Track expenses and cost records.">
      <ExpenseListPage />
    </AppShell>
  );
}
