"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";

const HIDE_FOOTER = new Set(["/", "/ride", "/delivery", "/farm"]);

export function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDE_FOOTER.has(pathname)) return null;
  return <SiteFooter />;
}
