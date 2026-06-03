import { AppShell } from "@/components/app-shell";
import { SettingsFormPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Invoice Settings" description="Set invoice details and numbering format.">
      <SettingsFormPage title="Invoice Settings" />
    </AppShell>
  );
}
