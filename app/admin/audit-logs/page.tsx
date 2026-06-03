import { AppShell } from "@/components/app-shell";
import { AuditLogsPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Audit Logs" description="Track key activities done in the system.">
      <AuditLogsPage />
    </AppShell>
  );
}
