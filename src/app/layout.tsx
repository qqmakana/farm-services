import { Source_Sans_3, Space_Grotesk } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { ConditionalFooter } from "@/components/conditional-footer";
import { CountryProvider } from "@/components/country/country-provider";
import { CountryWelcomeModal } from "@/components/country/country-selector";
import { InstallShareBar } from "@/components/install-share-bar";
import { PwaRegister } from "@/components/pwa-register";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { OfflineBanner } from "@/components/offline-banner";
import { ErrorReporter } from "@/components/error-reporter";
import { AnalyticsBeacon } from "@/components/analytics-beacon";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://village-ride.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND.appName} — ${BRAND.company}`,
    template: `%s · ${BRAND.appName}`,
  },
  description: BRAND_TAGLINE,
  applicationName: BRAND.appName,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND.appName,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: `${BRAND.appName} by ${BRAND.company}`,
    description: BRAND_TAGLINE,
    url: siteUrl,
    siteName: BRAND.appName,
    type: "website",
    images: [
      {
        url: "/village-ride-whatsapp-booking.png",
        width: 1080,
        height: 1080,
        alt: "Village Ride — book free on WhatsApp",
      },
      { url: "/village-ride-social-feed.png" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.appName} by ${BRAND.company}`,
    description: BRAND_TAGLINE,
    images: ["/village-ride-whatsapp-booking.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#1A4D3A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-ZA" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-[var(--ru-canvas)] font-[family-name:var(--font-sans)] text-[var(--ru-ink)] antialiased">
        <CountryProvider>
          <ThemeProvider>
            <ToastProvider>
              <PwaRegister />
              <OfflineBanner />
              <ErrorReporter />
              <AnalyticsBeacon />
              <div className="flex-1">{children}</div>
              <ConditionalFooter />
              <InstallShareBar />
              <WhatsAppFloat />
              <CountryWelcomeModal />
            </ToastProvider>
          </ThemeProvider>
        </CountryProvider>
      </body>
    </html>
  );
}
