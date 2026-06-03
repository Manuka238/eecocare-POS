import { AppShell } from "@/components/app-shell";
import { SuppliersPage } from "@/components/contact-pages";

export default function Page() {
  return <AppShell title="Suppliers" description="Active supplier summary, advanced filters, quick search, export tools, and supplier details."><SuppliersPage /></AppShell>;
}
