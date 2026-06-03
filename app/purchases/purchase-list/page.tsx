import { AppShell } from "@/components/app-shell";
import { PurchasesTable } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Purchase List" description="Track business purchases and supplier orders.">
      <PurchasesTable />
    </AppShell>
  );
}
