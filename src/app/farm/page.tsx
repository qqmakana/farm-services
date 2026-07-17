import { redirect } from "next/navigation";

/** Farm Connect entry — locks service_type to farm so the app knows it's a farm job. */
export default function FarmPage() {
  redirect("/book?service=farm");
}
