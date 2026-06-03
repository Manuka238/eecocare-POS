import { AppShell } from "@/components/app-shell";
import { ImportContactsPage } from "@/components/contact-pages";

export default function Page() {
  return <AppShell title="Import Contacts" description="Import customers with the same CSV and Excel structure used by contact exports."><ImportContactsPage /></AppShell>;
}
