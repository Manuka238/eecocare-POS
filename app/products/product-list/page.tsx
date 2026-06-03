import { AppShell } from "@/components/app-shell";
import { ProductsTable } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Product List" description="Manage product inventory, stock levels, and pricing.">
      <ProductsTable />
    </AppShell>
  );
}
