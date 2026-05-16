import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ToastContainer } from "react-toastify";
import AuthProvider from "@/components/AuthProvider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
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
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AuthProvider>
            {children}
            <ToastContainer position="bottom-right" />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
