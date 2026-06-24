import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AchievementsProvider } from "@/components/achievements/AchievementsProvider";
import { ChatNotificationProvider } from "@/components/chat/ChatNotificationProvider";
import { LiveSyncTrigger } from "@/components/LiveSyncTrigger";
import Script from "next/script";
import GoalCelebration from "@/components/GoalCelebration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Support Your Colors — WK 2026",
  description: "The home of your World Cup 2026 friend group.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
    shortcut: "/icon.png",
  },
  manifest: "/manifest.webmanifest",
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
        <Script id="startup-sound" strategy="beforeInteractive">{`
(function(){
  var k="startup_sound_at",c=1800000;
  var last=parseInt(localStorage.getItem(k)||"0",10);
  if(Date.now()-last<c)return;
  localStorage.setItem(k,Date.now().toString());
  var a=new Audio("/sounds/startup.mp3");
  a.volume=0.6;
  a.play().catch(function(){});
})();
`}</Script>
        <AuthProvider>
          <AchievementsProvider>
            <ChatNotificationProvider>
              <LiveSyncTrigger />
              <GoalCelebration />
              <main className="flex-1 w-full max-w-md mx-auto pb-28">
                {children}
              </main>
              <BottomNav />
            </ChatNotificationProvider>
          </AchievementsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
