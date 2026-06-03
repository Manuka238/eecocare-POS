import { AppShell } from "@/components/app-shell";
import { PurchaseReturnPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Purchase Return" description="Track purchase return records.">
      <PurchaseReturnPage />
    </AppShell>
  );
}
