import { Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { ConditionalFooter } from "@/components/conditional-footer";
import { CountryProvider } from "@/components/country/country-provider";
import { CountryWelcomeModal } from "@/components/country/country-selector";
import { DriverWantedNotice } from "@/components/driver-wanted-notice";
import { UnsupportedMarketNotice } from "@/components/country/unsupported-market-notice";
import { InstallShareBar } from "@/components/install-share-bar";
import { PwaRegister } from "@/components/pwa-register";
import { PwaRecover } from "@/components/pwa-recover";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { FlushPendingBookings } from "@/components/booking/flush-pending-bookings";
import { OfflineBanner } from "@/components/offline-banner";
import { FlushPendingPlaces } from "@/components/location/flush-pending-places";
import { ErrorReporter } from "@/components/error-reporter";
import { AnalyticsBeacon } from "@/components/analytics-beacon";
import { GoogleAnalytics } from "@/components/analytics-ga";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { BRAND, BRAND_TAGLINE } from "@/lib/brand";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
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
    "view-transition": "same-origin",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-ZA" className={`${sans.variable} h-full`}>
      <body className="min-h-full bg-[#F5F5F5] font-[family-name:var(--font-sans)] text-[#111111] antialiased">
        <CountryProvider>
          <ThemeProvider>
            <ToastProvider>
              <PhoneFrame>
                <PwaRegister />
                <PwaRecover />
                <OfflineBanner />
                <FlushPendingPlaces />
                <FlushPendingBookings />
                <ErrorReporter />
                <AnalyticsBeacon />
                <GoogleAnalytics />
                <div className="flex min-h-dvh flex-1 flex-col">
                  <div className="flex-1">{children}</div>
                  <ConditionalFooter />
                </div>
                <InstallShareBar />
                <WhatsAppFloat />
                <CountryWelcomeModal />
                <DriverWantedNotice />
                <UnsupportedMarketNotice />
              </PhoneFrame>
            </ToastProvider>
          </ThemeProvider>
        </CountryProvider>
      </body>
    </html>
  );
}
