import { AppShell } from "@/components/app-shell";
import { StockAdjustmentPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Stock Adjustment" description="Adjust stock counts and reasons.">
      <StockAdjustmentPage />
    </AppShell>
  );
}
