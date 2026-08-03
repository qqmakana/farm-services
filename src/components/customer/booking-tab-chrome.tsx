"use client";

import type { ReactNode } from "react";
import { CustomerTabBar } from "@/components/customer/customer-tab-bar";

/** Booking routes live outside (customer) layout — still need the 3-tab bar. */
export function BookingTabChrome({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CustomerTabBar />
    </>
  );
}
