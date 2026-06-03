import { AppShell } from "@/components/app-shell";
import { CategoriesPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Categories" description="Manage product categories.">
      <CategoriesPage />
    </AppShell>
  );
}
