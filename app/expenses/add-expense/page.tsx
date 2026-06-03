import { AppShell } from "@/components/app-shell";
import { ImportPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Add Expense" description="Create a new expense entry.">
      <ImportPage title="Add Expense Form Placeholder" />
    </AppShell>
  );
}
