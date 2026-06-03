import { AppShell } from "@/components/app-shell";
import { SpecialPackagesPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Special Packages" description="Create and manage promotional product bundles.">
      <SpecialPackagesPage />
    </AppShell>
  );
}
