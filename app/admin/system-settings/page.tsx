import { AppShell } from "@/components/app-shell";
import { SettingsFormPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="System Settings" description="Manage system preferences.">
      <SettingsFormPage title="System Settings" />
    </AppShell>
  );
}
