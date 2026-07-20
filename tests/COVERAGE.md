# Village Ride — Automated Test Coverage Report

Last updated with the Playwright suite under `tests/`.

## Features covered

| Area | Coverage | Specs |
|------|----------|-------|
| Public pages | High | `public-pages.spec.ts` |
| Partners marketing | High | `public-pages.spec.ts` |
| Merchant dashboard UX | High (mock) | `merchant-flow.spec.ts` |
| Create / schedule delivery | High (mock) | `merchant-flow.spec.ts` |
| Referral UI | Medium | `merchant-flow.spec.ts`, `api/partners.spec.ts` |
| Weekly reports | Medium | `merchant-flow.spec.ts` |
| Driver online / accept / complete | High (mock) | `driver-flow.spec.ts`, `uber-flow.spec.ts` |
| Commission wallet | High | `uber-flow.spec.ts`, `test:logic` |
| Trip tracking / share | Medium | `trip-tracking.spec.ts` |
| FCM token registration | Medium (mock API) | `api/notifications.spec.ts` |
| Auth gates (prod) | Medium | `security.spec.ts` |
| Performance / mobile layout | Medium | `performance.spec.ts` |

## Edge cases covered

- Invalid trip code (no crash)
- Empty merchant signup (HTML5 required)
- Production refuses destructive merchant tests
- Mock e2e API denied on production
- Horizontal overflow check on public pages

## Known gaps (priority)

1. **Live Supabase merchant signup E2E** — skipped on production to avoid spam; needs disposable test project.
2. **Real FCM device push** — mocked (`[fcm:mock]` / e2e token); no physical device in CI.
3. **RLS policy matrix** — not fully exercised via SQL; rely on `PARTNER_SYSTEM.sql` + prod redirect smokes.
4. **Lighthouse ≥90** — not enforced in CI (cold Vercel starts fail hard thresholds); use PageSpeed Insights manually.
5. **Proof of delivery photos** — feature not shipped yet.
6. **Two-way rating UI** — partially covered; customer→driver in live-trip, driver→customer optional in driver-flow.

## How to interpret failures

- **Local mock flaky ACCEPT** — increase offer timeout; ensure driver stayed online.
- **Production public page timeout** — cold start; retries=2 in CI.
- **Merchant dashboard login redirect locally** — ensure Playwright webServer clears `NEXT_PUBLIC_SUPABASE_*`.

## Commands

```bash
npm run test:logic          # wallet / mock unit logic
npm run test:e2e            # full local mock Playwright
npm run test:e2e:prod       # production public + security smoke
npm run test:e2e:uber       # original Uber journey only
```
