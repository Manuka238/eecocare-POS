import { AppShell } from "@/components/app-shell";
import { CustomerGroupsPage } from "@/components/contact-pages";

export default function Page() {
  return <AppShell title="Customer Groups" description="Set up customer categories, rules, and follow-up policies for the full contact system."><CustomerGroupsPage /></AppShell>;
}
