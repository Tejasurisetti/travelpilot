import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TravelPilot",
  description: "Intelligent trip planning and disruption management",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-[var(--chart-white)] text-[var(--rail-ink)]">{children}</body>
    </html>
  );
}
