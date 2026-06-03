import { AppShell } from "@/components/app-shell";
import { RolesPermissionsPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Roles & Permissions" description="Create custom job roles and permission sets.">
      <RolesPermissionsPage />
    </AppShell>
  );
}
