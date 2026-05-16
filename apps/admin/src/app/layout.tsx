import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spacefly.ai Dashboard",
  description: "Host and admin dashboard for Spacefly.ai workspace platform",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/brand/app_icon_16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/app_icon_32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/app_icon_64x64.png", sizes: "64x64", type: "image/png" },
      { url: "/brand/app_icon_512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/brand/app_icon_180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
