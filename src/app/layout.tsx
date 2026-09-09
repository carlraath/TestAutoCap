import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { TITLE_DEVICE } from "@/engine/structure";

export const metadata: Metadata = {
  title: TITLE_DEVICE,
  description: "Capability placement assessment for the test automation training programme.",
  icons: { icon: "/brand/favicon.svg", apple: "/brand/webclip.svg" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-AU" className="h-full">
      <body className="flex min-h-full flex-col bg-surface text-ink-900">{children}</body>
    </html>
  );
}
