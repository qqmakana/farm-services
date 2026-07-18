# What YOU do after the code (manual steps only)

**Village Ride** by Sandton Streets  
97 Perth Road, Westdene, Johannesburg, 2092 · 063 621 3590 (call & WhatsApp) · ai@sandtonstreets.com

The app now includes: Supabase matching, locked RLS SQL, PayPal webhooks,
server fares, commission split fields, SOS, trip share, ops login, driver hiring.

## Local click-through (before keys)

With empty PayPal/Supabase in `.env.local`, the app runs on **local mock data**.
On Book / Buy you’ll see **Pay (local test)** — use that to exercise the full
flow (pay → trip → driver accept → complete → rate) before pasting SQL/keys.

## A. Paste SQL (required) — shared Supabase OK

Village Ride tables all start with **`rr_`** so they will **not** overwrite your other app.

1. Open https://supabase.com → your **shared** project → **SQL Editor** → **New query**
2. On your PC open this file (should already be open):

`C:\Users\makan\OneDrive\Desktop\farm-services\supabase\PASTE_ME.sql`

3. Press **Ctrl+A** then **Ctrl+C** (copy the whole file)
4. Paste into Supabase → click **Run**
5. In **Table Editor** you should see: `rr_jobs`, `rr_drivers`, `rr_profiles`, etc.

If Realtime complains, ignore; then **Database → Replication** enable: `rr_jobs`, `rr_drivers`, `rr_job_applications`, `rr_sos_events`

## B. Env keys (required)

Create/update `.env.local`:

```env
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=live
PAYPAL_CURRENCY=ZAR
NEXT_PUBLIC_PAYPAL_CURRENCY=ZAR

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` = Supabase → Settings → API → **service_role** (keep secret).

## C. Create dispatcher login

1. Supabase → Authentication → Users → Add user (email + password)
2. SQL:

```sql
update public.rr_profiles
set role = 'dispatcher'
where id = '<that_user_uuid>';
```

3. Open `/login` → sign in → `/dispatch` unlocks

## C2. Cash + driver niches + docs (run after PASTE_ME)

In Supabase SQL Editor, run these files in order if you have not:

1. `supabase/ADD_CASH_PAYMENT.sql` (cash payments)
2. `supabase/PERFECT_UPGRADE.sql` (driver Night/Heavy/Village opt-ins + ID/license storage)

## D. PayPal live + webhook (required for production money)

1. Add env on **Vercel** (and `.env.local`):
   - `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `PAYPAL_MODE=live`
   - `PAYPAL_CURRENCY=ZAR` / `NEXT_PUBLIC_PAYPAL_CURRENCY=ZAR`
2. Deploy to Vercel
3. PayPal Developer → Webhooks → add:
   `https://village-ride.vercel.app/api/paypal/webhook`
4. Subscribe to: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`, `PAYMENT.CAPTURE.REVERSED`

## D2. Driver trust loop

1. Driver → `/driver` → toggle Night / Heavy / Village preferences  
2. Driver uploads ID + license photos  
3. Ops → `/dispatch` → **Docs to review** → open files → **Mark verified**  
Customers then see **ID & License Verified** on the trip.

## E. Run / deploy

```bash
npm install
npm run dev
```

Or push to GitHub → Vercel → paste same env vars → Deploy.

## F. Onboard people

| Who | Where |
|-----|--------|
| New drivers | `/driver` → **Apply to drive** → you approve in `/dispatch` hiring queue |
| Approved drivers | `/driver` → Go online → Accept trips (auto-matched) |
| Farmers / shops | `/shop` → category Farm or Shop |
| Customers | Home → pick role |
| You | `/login` → `/dispatch` (hire queue + jobs) |

**Hiring vs trips:** You manually approve who can *work for you*. After that, trip matching is automatic (nearest online driver). Ops can still override a single trip if needed.

## Done when

- [ ] PASTE_ME.sql ran without errors
- [ ] `.env.local` has PayPal live + Supabase URL/anon/service_role
- [ ] Dispatcher user can open `/dispatch`
- [ ] Test PayPal payment creates a job with a matched driver
- [ ] Webhook URL live on Vercel
