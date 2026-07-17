import {
  getPayPalCurrency,
  isPayPalConfigured,
} from "./paypal";

const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

async function getAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal not configured");
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function paypalRefundCapture(
  captureId: string,
  amountZar?: number,
) {
  if (!isPayPalConfigured()) throw new Error("PayPal not configured");
  const token = await getAccessToken();
  const body =
    amountZar != null
      ? {
          amount: {
            value: Number(amountZar).toFixed(2),
            currency_code: getPayPalCurrency(),
          },
        }
      : {};

  const res = await fetch(
    `${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`PayPal refund failed: ${await res.text()}`);
  return res.json();
}
