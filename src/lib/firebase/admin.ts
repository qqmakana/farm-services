import type { App } from "firebase-admin/app";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID?.trim() &&
      process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
      process.env.FIREBASE_PRIVATE_KEY?.trim(),
  );
}

function getAdminApp(): App | null {
  if (!isFirebaseAdminConfigured()) return null;
  const existing = getApps()[0];
  if (existing) return existing;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
    projectId: process.env.FIREBASE_PROJECT_ID!,
  });
}

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

/** Free FCM push. Logs mock when Firebase admin env is missing. */
export async function sendPushToToken(
  token: string | null | undefined,
  payload: PushPayload,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!token?.trim()) {
    return { ok: false, skipped: true, error: "no_token" };
  }

  if (!isFirebaseAdminConfigured()) {
    console.log("[fcm:mock]", payload.title, "—", payload.body, {
      token: `${token.slice(0, 12)}…`,
      data: payload.data,
    });
    return { ok: true, skipped: true };
  }

  try {
    const app = getAdminApp();
    if (!app) return { ok: false, skipped: true, error: "no_app" };

    await getMessaging(app).send({
      token: token.trim(),
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      webpush: {
        fcmOptions: {
          link: payload.data?.url || "/driver",
        },
      },
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[fcm] send failed", message);
    return { ok: false, error: message };
  }
}
