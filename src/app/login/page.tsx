import { Suspense } from "react";
import LoginClient from "./login-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F5]">
          <span className="vr-spin vr-spin-dark" aria-hidden />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
