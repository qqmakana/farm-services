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
  "/courier",
  "/driver/home",
  "/driver/jobs",
  "/driver/earnings",
  "/driver/account",
  "/get-app",
]);

export function ConditionalFooter() {
  const pathname = usePathname() ?? "";
  if (
    HIDE_FOOTER.has(pathname) ||
    pathname.startsWith("/account/") ||
    pathname.startsWith("/driver/home") ||
    pathname.startsWith("/driver/jobs") ||
    pathname.startsWith("/driver/earnings") ||
    pathname.startsWith("/driver/account") ||
    pathname.startsWith("/trip/")
  ) {
    return null;
  }
  return <SiteFooter />;
}
