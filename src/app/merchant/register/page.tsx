import { redirect } from "next/navigation";

function queryFrom(sp: Record<string, string | string[] | undefined>) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string" && value) q.set(key, value);
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Canonical URL people type: /merchant/register */
export default async function MerchantRegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  redirect(`/shop/register${queryFrom(sp)}`);
}
