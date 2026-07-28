import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NotaryPro - Mobile Notary Business Management",
  description: "Comprehensive business management dashboard for mobile notaries. Track signings, clients, invoices, expenses, and analytics.",
  keywords: ["NotaryPro", "notary", "mobile notary", "business management", "signings", "invoices"],
  authors: [{ name: "NotaryPro" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "NotaryPro",
    description: "Mobile Notary Business Management Dashboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NotaryPro",
    description: "Mobile Notary Business Management Dashboard",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
