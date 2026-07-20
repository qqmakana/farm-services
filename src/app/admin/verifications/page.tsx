import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { VerificationsBoard } from "@/components/admin/verifications-board";

export const dynamic = "force-dynamic";

export default function AdminVerificationsPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-8 pb-16">
        <p className="mb-4 text-sm">
          <Link href="/dispatch" className="font-semibold text-[#1A4D3A]">
            ← Dispatch
          </Link>
        </p>
        <VerificationsBoard />
      </main>
    </>
  );
}
