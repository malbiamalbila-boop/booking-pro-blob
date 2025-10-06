import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BookingPro Fleet Ops",
  description: "Internal rental operations workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="min-h-full">
      <body>{children}</body>
    </html>
  );
}
