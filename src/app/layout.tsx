import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Authentic Chain — Fake Profile Detection",
  description:
    "AI-powered fake social media profile detection using multi-layer analysis and blockchain-backed verification.",
  keywords: [
    "fake profile detection",
    "social media verification",
    "blockchain proof",
    "AI analysis",
  ],
  icons: {
    icon: "/aclogo.png",
    shortcut: "/aclogo.png",
    apple: "/aclogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/aclogo.png" type="image/png" />
        <link rel="shortcut icon" href="/aclogo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/aclogo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-black text-white">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
