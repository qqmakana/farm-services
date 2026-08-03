/**
 * Alias webhook path for Village Pass docs.
 * Canonical handler: /api/paypal/webhook
 */
export const runtime = "nodejs";

export { POST } from "@/app/api/paypal/webhook/route";
