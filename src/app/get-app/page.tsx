import type { Metadata } from "next";
import { EasyInstallScreen } from "@/components/easy-install-screen";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Install ${BRAND.appName}`,
  description: `Tap once to install ${BRAND.appName} on your phone.`,
  robots: { index: true, follow: true },
};

/** WhatsApp-friendly one-tap install page. Share this URL, not the homepage. */
export default function GetAppPage() {
  return <EasyInstallScreen />;
}
