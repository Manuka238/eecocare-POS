import { AppShell } from "@/components/app-shell";
import { ImportPage } from "@/components/pages";

export default function Page() {
  return (
    <AppShell title="Add Purchase" description="Add a new purchase record.">
      <ImportPage title="Add Purchase Form Placeholder" />
    </AppShell>
  );
}
