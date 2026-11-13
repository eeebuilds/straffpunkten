import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import Header from "@/components/Header";
import AuthSync from "@/components/AuthSync";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://straffpunkten.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Straffpunkten – dagens fotbollsquiz",
  description: "11 nya fotbollsfrågor varje dag. En straff per fråga, 20 sekunder på dig. Samma frågor för alla, en chans per dag.",
  openGraph: {
    title: "Straffpunkten – dagens fotbollsquiz",
    description: "11 straffar. 20 sekunder per skott. Samma frågor för alla, en chans per dag.",
    locale: "sv_SE",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#eef1ec",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700&family=Big+Shoulders+Display:wght@700;800;900&family=JetBrains+Mono:wght@500;700&family=Source+Serif+4:ital,wght@1,400&display=swap"
        />
      </head>
      <body>
        <Header />
        <AuthSync />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
