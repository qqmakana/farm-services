import type { Metadata } from "next";
import { EasyInstallScreen } from "@/components/easy-install-screen";
import { BRAND } from "@/lib/brand";

const title = `Install ${BRAND.appName}`;
const description = `Install ${BRAND.appName} on your home screen — not on Play Store yet. Opens end of September. Cash or card.`;

export const metadata: Metadata = {
  title,
  description,
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: "/village-ride-share.png",
        width: 1024,
        height: 1024,
        alt: `${BRAND.appName} — rides and deliveries for villages, towns and cities`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/village-ride-share.png"],
  },
};

/** WhatsApp-friendly one-tap install page. Share this URL, not the homepage. */
export default function GetAppPage() {
  return <EasyInstallScreen />;
}
