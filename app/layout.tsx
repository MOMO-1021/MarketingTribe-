import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader, Outfit } from "next/font/google";
import "./globals.css";

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "MarketingTribe",
  title: { default: "MarketingTribe", template: "%s · MarketingTribe" },
  description: "A small, account-only room for marketers in India.",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
