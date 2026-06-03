import { AppShell } from "@/components/app-shell";
import { BackupPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Backup" description="Backup tools and restore placeholders.">
      <BackupPage />
    </AppShell>
  );
}
