import { AppShell } from "@/components/app-shell";
import { AddProductPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Add Product" description="Create a new product using the shared POS form style.">
      <AddProductPage />
    </AppShell>
  );
}
