const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

export function isPayPalConfigured() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() ?? "";
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim() ?? "";
  if (!clientId || !secret) return false;
  const bad = (v: string) =>
    /your[_./]|example|placeholder/i.test(v) || v.length < 10;
  if (bad(clientId) || bad(secret)) return false;
  return true;
}

export function getPayPalCurrency() {
  return (process.env.PAYPAL_CURRENCY || "ZAR").toUpperCase();
}

async function getAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error(
      "PayPal is not configured. Add NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env.local",
    );
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function paypalCreateOrder(params: {
  amountZar: number;
  description: string;
  reference?: string;
}) {
  const token = await getAccessToken();
  const currency = getPayPalCurrency();
  const value = Number(params.amountZar).toFixed(2);

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: params.description.slice(0, 127),
          custom_id: params.reference?.slice(0, 127),
          amount: {
            currency_code: currency,
            value,
          },
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        brand_name: "Village Ride",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal create order failed: ${text}`);
  }

  const order = (await res.json()) as { id: string; status: string };
  return order;
}

export async function paypalCaptureOrder(orderId: string) {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  // If already captured (retry), fetch the order instead of failing hard.
  if (!res.ok) {
    const text = await res.text();
    if (
      text.includes("ORDER_ALREADY_CAPTURED") ||
      text.includes("ALREADY_CAPTURED")
    ) {
      const getRes = await fetch(
        `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!getRes.ok) {
        throw new Error(`PayPal capture failed: ${text}`);
      }
      const existing = (await getRes.json()) as {
        id: string;
        status: string;
        purchase_units?: Array<{
          payments?: {
            captures?: Array<{ id: string; status: string }>;
          };
        }>;
      };
      const captureId =
        existing.purchase_units?.[0]?.payments?.captures?.[0]?.id ??
        existing.id;
      return {
        orderId: existing.id,
        captureId,
        status: existing.status,
      };
    }
    throw new Error(`PayPal capture failed: ${text}`);
  }

  const capture = (await res.json()) as {
    id: string;
    status: string;
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{ id: string; status: string }>;
      };
    }>;
  };

  const captureId =
    capture.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? capture.id;

  if (capture.status !== "COMPLETED") {
    throw new Error(`PayPal payment not completed (${capture.status})`);
  }

  return { orderId: capture.id, captureId, status: capture.status };
}
