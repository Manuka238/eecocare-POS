import { AppShell } from "@/components/app-shell";
import { CustomersPage } from "@/components/contact-pages";

export default function Page() {
  return <AppShell title="Customers" description="Customer totals by type, searchable list, export actions, and view/edit contact details."><CustomersPage /></AppShell>;
}
