import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FrappeAuthProvider } from "@/contexts/FrappeAuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Frappe OAuth Demo - Next.js",
  description: "OAuth 2.0 authentication demo with Frappe Framework using Next.js, TypeScript, and frappe-react-sdk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FrappeAuthProvider>{children}</FrappeAuthProvider>
      </body>
    </html>
  );
}
