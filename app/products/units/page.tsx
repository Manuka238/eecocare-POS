import { AppShell } from "@/components/app-shell";
import { UnitsPage } from "@/components/pages";
import { Scale } from "lucide-react";

export default function Page() {
  return (
    <AppShell
      title="Units"
      description="Manage item units."
      customIcon={<Scale className="h-5 w-5" />}
      customGradient="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white shadow-xl border-none"
    >
      <UnitsPage />
    </AppShell>
  );
}
