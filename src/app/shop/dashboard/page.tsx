import { redirect } from "next/navigation";

/** Shop owner dashboard — same merchant partner dashboard. */
export default function ShopDashboardPage() {
  redirect("/merchant/dashboard");
}
