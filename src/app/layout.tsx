import { Source_Sans_3 } from "next/font/google";
import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";
import { ConditionalFooter } from "@/components/conditional-footer";
import { CountryProvider } from "@/components/country/country-provider";
import { CountryWelcomeModal } from "@/components/country/country-selector";
import { UnsupportedMarketNotice } from "@/components/country/unsupported-market-notice";
import { InstallShareBar } from "@/components/install-share-bar";
import { PwaRegister } from "@/components/pwa-register";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { FlushPendingBookings } from "@/components/booking/flush-pending-bookings";
import { OfflineBanner } from "@/components/offline-banner";
import { FlushPendingPlaces } from "@/components/location/flush-pending-places";
import { ErrorReporter } from "@/components/error-reporter";
import { AnalyticsBeacon } from "@/components/analytics-beacon";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { BRAND, BRAND_TAGLINE } from "@/lib/brand";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

/** Self-hosted — Google CDN woff2 hashes for Space Grotesk break next/font builds. */
const display = localFont({
  src: "./fonts/space-grotesk.woff2",
  variable: "--font-display",
  weight: "500 700",
  display: "swap",
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
        url: "/village-ride-share.png",
        width: 1024,
        height: 1024,
        alt: "Village Ride — rides and deliveries for villages, towns and cities",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.appName} by ${BRAND.company}`,
    description: BRAND_TAGLINE,
    images: ["/village-ride-share.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-ZA" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="min-h-full bg-gray-100 font-[family-name:var(--font-sans)] text-[var(--ru-ink)] antialiased">
        <CountryProvider>
          <ThemeProvider>
            <ToastProvider>
              <PhoneFrame>
                <PwaRegister />
                <OfflineBanner />
                <FlushPendingPlaces />
                <FlushPendingBookings />
                <ErrorReporter />
                <AnalyticsBeacon />
                <div className="flex min-h-dvh flex-1 flex-col">
                  <div className="flex-1">{children}</div>
                  <ConditionalFooter />
                </div>
                <InstallShareBar />
                <WhatsAppFloat />
                <CountryWelcomeModal />
                <UnsupportedMarketNotice />
              </PhoneFrame>
            </ToastProvider>
          </ThemeProvider>
        </CountryProvider>
      </body>
    </html>
  );
}
