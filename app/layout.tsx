import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AchievementsProvider } from "@/components/achievements/AchievementsProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Support Your Colors — WK 2026",
  description: "The home of your World Cup 2026 friend group.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F0F2F5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <AchievementsProvider>
            <main className="flex-1 w-full max-w-md mx-auto pb-28">
              {children}
            </main>
            <BottomNav />
          </AchievementsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
