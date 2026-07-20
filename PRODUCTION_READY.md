# Environment variables (add to `.env.local` / Vercel)

```bash
# Comma-separated — required for /admin/* when set
ADMIN_EMAILS=you@example.com

# Optional free email webhook (Make / n8n / Resend proxy)
PARTNER_EMAIL_WEBHOOK=https://your-webhook.example/email

# Protects /api/cron/partner-weekly
CRON_SECRET=change-me

# WhatsApp / support (optional — defaults to BRAND phone)
SUPPORT_PHONE=27636213590
DRIVER_SIGNUP_PHONE=27636213590
```

## SQL to run

In Supabase SQL editor:
1. `supabase/PRODUCTION_OPS.sql` (full package — includes email logs)
2. If you already ran an older PRODUCTION_OPS without email logs: also run `supabase/EMAIL_LOGS.sql`

## New routes

| Route | Purpose |
|-------|---------|
| `/admin/dashboard` | Stats, activity, refund notes |
| `/admin/errors` | Error inbox (filter + search) |
| `/admin/analytics` | Page views + events |
| `/admin/monitoring` | Health checks |
| `/api/health` | Uptime probe |
| `/api/admin/check` | Nav gate for Admin link |
| `/driver/join` | Driver recruitment |
| `/pricing` | Clear fees |
| `/merchant/referrals` | Referral stats + share |

## Optional follow-ups

| SQL | Purpose |
|-----|---------|
| `supabase/EMAIL_LOGS.sql` | Email send audit (if not in latest PRODUCTION_OPS) |
| `supabase/SHOP_RATINGS.sql` | Driver → merchant ratings |

## Final mobile UX (already in app)

- PWA: `src/app/manifest.ts` + `public/sw.js` + icons (no `next-pwa` needed)
- Install banner: dismissible Uber-style bar
- Toast + dark mode toggle in nav
- Trip share modal + merchant push prompt + two-way ratings
