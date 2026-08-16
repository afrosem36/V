import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppBootstrap } from "@/components/AppBootstrap";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vshape Trainer",
  description: "Personal training system for building a V-shaped physique.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vshape",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-text">
        <AppBootstrap>
          <AppShell>{children}</AppShell>
        </AppBootstrap>
      </body>
    </html>
  );
}
