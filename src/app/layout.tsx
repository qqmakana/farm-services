import { Source_Sans_3, Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { BRAND, BRAND_TAGLINE } from "@/lib/brand";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.appName} — ${BRAND.company}`,
    template: `%s · ${BRAND.appName}`,
  },
  description: BRAND_TAGLINE,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-ZA" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-[var(--ru-canvas)] font-[family-name:var(--font-sans)] text-[var(--ru-ink)] antialiased">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
