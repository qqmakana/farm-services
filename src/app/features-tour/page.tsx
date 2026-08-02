import { redirect } from "next/navigation";

/** Alias for the in-app product tour. */
export default function FeaturesTourPage() {
  redirect("/onboarding?replay=1");
}
