import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "FakeID Shield — Fake Profile Detection System",
  description:
    "AI-powered fake social media profile detection using multi-layer analysis, image comparison, and blockchain-backed verification proof.",
  keywords: [
    "fake profile detection",
    "social media verification",
    "blockchain proof",
    "image comparison",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-grid min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
