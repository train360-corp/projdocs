import "./index.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ReactNode } from "react";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";
import DashboardLayout from "@workspace/admin/layout/dashboard";
import { Toaster } from "@workspace/ui/components/sonner.tsx";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProjDocs Admin",
  description: "Admin Portal for ProjDocs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      <ThemeProvider
        attribute={"class"}
        defaultTheme={"system"}
        enableSystem
        disableTransitionOnChange
      >
        <Toaster />
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </ThemeProvider>
      </body>
    </html>
  );
}
