"use client";

import type { ReactNode } from "react";
import { CustomerTabBar } from "@/components/customer/customer-tab-bar";

/** Booking routes live outside (customer) layout — still need the tab bar, except on full-screen maps. */
export function BookingTabChrome({
  children,
  hideTabBar = false,
}: {
  children: ReactNode;
  /** Map booking screens (Ride / Send / Fetch / Farm) — no bottom nav over the map. */
  hideTabBar?: boolean;
}) {
  return (
    <>
      {children}
      {hideTabBar ? null : <CustomerTabBar />}
    </>
  );
}
