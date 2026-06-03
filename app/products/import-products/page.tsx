import { AppShell } from "@/components/app-shell";
import { ImportProductsPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Import Products" description="Import products using CSV or Excel templates.">
      <ImportProductsPage />
    </AppShell>
  );
}
