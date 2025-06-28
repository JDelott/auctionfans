import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuctionFans - Creator Item Auctions",
  description: "Buy authentic items used by your favorite content creators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
