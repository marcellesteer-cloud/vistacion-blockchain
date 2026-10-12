import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl } from "@/src/lib/site-url";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Vistacoin | Sepolia Testnet App",
    template: "%s | Vistacoin",
  },
  description:
    "Explore Vistacoin token, staking, escrow, governance, and sale features on Sepolia testnet. Test assets only; not for real payments.",
  applicationName: "Vistacoin",
  keywords: [
    "Vistacoin",
    "VSC",
    "Sepolia",
    "testnet",
    "token dashboard",
    "escrow prototype",
  ],
  openGraph: {
    type: "website",
    siteName: "Vistacoin",
    title: "Vistacoin | Sepolia Testnet App",
    description:
      "Explore Vistacoin token, staking, escrow, governance, and sale features on Sepolia testnet. Test assets only; not for real payments.",
  },
  twitter: {
    card: "summary",
    title: "Vistacoin | Sepolia Testnet App",
    description:
      "Explore Vistacoin features on Sepolia testnet. Test assets only; not for real payments.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
