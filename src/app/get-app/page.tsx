import type { Metadata } from "next";
import { EasyInstallScreen } from "@/components/easy-install-screen";
import { BRAND } from "@/lib/brand";

const title = `Install ${BRAND.appName}`;
const description = `${BRAND.appName} serves villages, towns and cities. Riders are welcome, and we humbly need a few more drivers. Cash or card.`;

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
