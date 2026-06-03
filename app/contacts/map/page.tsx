import { AppShell } from "@/components/app-shell";
import { CustomerMapPage } from "@/components/contact-pages";

export default function Page() {
  return <AppShell title="Customer Map" description="Searchable Sri Lanka map view with customer type colors and location details."><CustomerMapPage /></AppShell>;
}
