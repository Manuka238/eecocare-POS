import { AppShell } from "@/components/app-shell";
import { SettingsFormPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Business Settings" description="Configure business profile settings.">
      <SettingsFormPage title="Business Settings" />
    </AppShell>
  );
}
