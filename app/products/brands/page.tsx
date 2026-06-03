import { AppShell } from "@/components/app-shell";
import { BrandsPage } from "@/components/pages";
import { Bookmark } from "lucide-react";

export default function Page() {
  return (
    <AppShell
      title="Brands"
      description="Manage product brands."
      customIcon={<Bookmark className="h-5 w-5" />}
      customGradient="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl border-none"
    >
      <BrandsPage />
    </AppShell>
  );
}
