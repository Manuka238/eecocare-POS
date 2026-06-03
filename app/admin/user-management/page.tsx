import { AppShell } from "@/components/app-shell";
import { UserManagementPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="User Management" description="Manage users for the business account.">
      <UserManagementPage />
    </AppShell>
  );
}
