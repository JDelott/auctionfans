import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: "FanVault - Creator Item Auctions",
  description: "Own authentic pieces from your favorite content creators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-zinc-950">
        <AuthProvider>
          <Navigation />
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
