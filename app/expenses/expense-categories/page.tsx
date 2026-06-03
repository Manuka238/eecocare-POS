import { AppShell } from "@/components/app-shell";
import { ExpenseCategoriesPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Expense Categories" description="Manage expense groups and categories.">
      <ExpenseCategoriesPage />
    </AppShell>
  );
}
