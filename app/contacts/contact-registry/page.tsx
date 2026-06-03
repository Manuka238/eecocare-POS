import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { ContactRegistryPage } from "@/components/contact-pages";

export default function Page() {
  return (
    <AppShell title="Contact Registry" description="Single add-contact page for suppliers, customers, and supplier-customer records.">
      <Suspense fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      }>
        <ContactRegistryPage />
      </Suspense>
    </AppShell>
  );
}
