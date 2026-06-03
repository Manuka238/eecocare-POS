import { AppShell } from "@/components/app-shell";
import { StockTransfersPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Stock Transfers" description="Move items between branches or warehouses.">
      <StockTransfersPage />
    </AppShell>
  );
}
