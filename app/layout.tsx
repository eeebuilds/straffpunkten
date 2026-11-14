import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import Header from "@/components/Header";
import AuthSync from "@/components/AuthSync";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://straffpunkten.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Straffpunkten – dagens fotbollsquiz",
  description: "Vem kan mest fotboll i kompisgänget? Spela dagens 11 frågor, starta en egen liga och utmana kompisarna om veckans topplista.",
  applicationName: "Straffpunkten",
  // På iPhone: helskärm från hemskärmen, mörk statusrad och kort namn under ikonen.
  appleWebApp: { capable: true, title: "Straffpunkten", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "Vem kan mest fotboll i kompisgänget? | Straffpunkten",
    description: "Samma quiz. Egen liga. Spela dagens 11 frågor och tävla med gänget om veckan.",
    locale: "sv_SE",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F4EBD9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&display=swap"
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
