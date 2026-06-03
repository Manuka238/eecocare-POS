import { AppShell } from "@/components/app-shell";
import { SettingsFormPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Tax Settings" description="Configure tax settings and rates.">
      <SettingsFormPage title="Tax Settings" />
    </AppShell>
  );
}
