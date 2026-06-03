import "./globals.css";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { DataProvider } from "@/components/data-provider";

export const metadata = {
  title: "EECO GROUP POS Control Hub",
  description: "Modern SaaS POS and Courier Resolution Hub developed for EECO GROUP.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
