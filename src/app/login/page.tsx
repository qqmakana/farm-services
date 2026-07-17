import { Suspense } from "react";
import LoginClient from "./login-client";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading…</p>}>
      <LoginClient />
    </Suspense>
  );
}
