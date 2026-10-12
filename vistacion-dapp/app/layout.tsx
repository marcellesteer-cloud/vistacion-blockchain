import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl } from "@/src/lib/site-url";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Vistacoin | Secure Global Trade",
    template: "%s | Vistacoin",
  },
  description:
    "Explore the Vistacoin escrow demo and private customer workspace. Real-money escrow is not enabled.",
  applicationName: "Vistacoin",
  keywords: [
    "Vistacoin",
    "VSC",
    "escrow demo",
    "customer management",
    "secure trade",
  ],
  openGraph: {
    type: "website",
    siteName: "Vistacoin",
    title: "Vistacoin | Secure Global Trade",
    description: "Explore the Vistacoin escrow demo and private customer workspace. Real-money escrow is not enabled.",
  },
  twitter: {
    card: "summary",
    title: "Vistacoin | Secure Global Trade",
    description: "Explore a fictional escrow walkthrough. No real-money escrow is available.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
