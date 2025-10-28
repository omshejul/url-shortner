import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import AuthErrorHandler from "./components/AuthErrorHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "URL Shortener",
  description: "A simple, fast, and secure URL shortener",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${figtree.variable} ${geistMono.variable} font-[family-name:var(--font-figtree)] antialiased`}
      >
        <Providers>
          <AuthErrorHandler>{children}</AuthErrorHandler>
        </Providers>
      </body>
    </html>
  );
}
