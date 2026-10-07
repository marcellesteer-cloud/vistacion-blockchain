import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vistacion | VSC Dashboard",
  description: "View your VSC balances and interact with the Sepolia testnet token.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
