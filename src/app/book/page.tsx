import { redirect } from "next/navigation";

/** Legacy /book?service=… → Uber-style service pages. */
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const sp = await searchParams;
  const raw = sp.service;
  if (raw === "delivery") redirect("/delivery");
  if (raw === "farm") redirect("/farm");
  redirect("/ride");
}
