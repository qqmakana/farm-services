"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";

const HIDE_FOOTER = new Set([
  "/",
  "/services",
  "/activity",
  "/account",
  "/ride",
  "/delivery",
  "/farm",
  "/driver/home",
  "/driver/jobs",
  "/driver/earnings",
  "/driver/account",
]);

export function ConditionalFooter() {
  const pathname = usePathname() ?? "";
  if (
    HIDE_FOOTER.has(pathname) ||
    pathname.startsWith("/account/") ||
    pathname.startsWith("/driver/")
  ) {
    return null;
  }
  return <SiteFooter />;
}
