import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { WagmiProvider } from "@/providers/WagmiProvider";
import GlobalBackground from "@/components/GlobalBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentMesh",
  description: "Safe Autonomous AI Workforce Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-transparent text-white font-sans overflow-x-hidden selection:bg-[#a855f7]/30">
        <GlobalBackground />
        <WagmiProvider>
          <Navigation />
          <main className="flex-1 flex flex-col">{children}</main>
        </WagmiProvider>
      </body>
    </html>
  );
}
