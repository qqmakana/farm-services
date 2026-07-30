import type { Metadata } from "next";
import { EasyInstallScreen } from "@/components/easy-install-screen";
import { BRAND } from "@/lib/brand";

const title = `Install ${BRAND.appName}`;
const description = `Tap once to install ${BRAND.appName} on your phone — free, no Play Store needed.`;

export const metadata: Metadata = {
  title,
  description,
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: BRAND.appName }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/icons/icon-512.png"],
  },
};

/** WhatsApp-friendly one-tap install page. Share this URL, not the homepage. */
export default function GetAppPage() {
  return <EasyInstallScreen />;
}
