# Free Firebase FCM setup (Village Ride)

Firebase Cloud Messaging on the **Spark (free)** plan is enough for launch push.

## 1. Create project

1. Open https://console.firebase.google.com  
2. **Add project** → name it e.g. `village-ride`  
3. Disable Google Analytics if you want (optional)  
4. Create project

## 2. Add a Web app

1. Project overview → **Web** (`</>`)  
2. App nickname: `Village Ride Web`  
3. Copy the `firebaseConfig` values into `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## 3. Web Push certificates (VAPID)

1. Project **Settings** → **Cloud Messaging**  
2. Under **Web Push certificates** → **Generate key pair**  
3. Paste into:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

## 4. Service account (server send)

1. Project **Settings** → **Service accounts**  
2. **Generate new private key** (JSON download)  
3. Map into `.env.local`:

```env
FIREBASE_PROJECT_ID=          # project_id from JSON
FIREBASE_CLIENT_EMAIL=        # client_email from JSON
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Keep `FIREBASE_PRIVATE_KEY` on one line with `\n` escaped.

## 5. Supabase

Run once in SQL Editor:

`supabase/AUTO_DISPATCH.sql`

(Adds `rr_drivers.fcm_token`, offer columns, `searching_driver` / `confirmed` statuses.)

## 6. Vercel

Paste the same Firebase keys on the Vercel project → Redeploy.

## Flow checklist

| Step | What happens |
|------|----------------|
| Driver → Go online | Permission prompt + token → `rr_drivers.fcm_token` |
| Customer → Request Ride | Job `searching_driver` → Smart Dispatch → FCM to best driver |
| Driver → Accept | Job `confirmed` → FCM to customer + Realtime trip UI |
| Decline / 30s | Next ranked driver (max 3) |

Without keys, offers still appear on `/driver`; server logs `[fcm:mock]`.
