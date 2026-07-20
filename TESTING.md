# Village Ride — Testing Guide

## Quick start

```bash
npm ci
npx playwright install chromium

# Unit / wallet / mock logic
npm run test:logic

# Full E2E against local mock (builds Next + starts server)
npm run test:e2e

# Uber journey only
npm run test:e2e:uber

# Interactive UI
npm run test:e2e:ui

# Production public smoke (no destructive writes)
npm run test:e2e:prod
```

## Projects

| Target | Env | What runs |
|--------|-----|-----------|
| Local mock (default) | `VILLAGE_RIDE_USE_MOCK=1`, Supabase public keys cleared | All flows |
| Production | `PLAYWRIGHT_TARGET=production` | `public-pages`, `performance`, `security` only |

## Layout

```
tests/
  helpers/           data generators, auth, cleanup
  public-pages.spec.ts
  merchant-flow.spec.ts
  driver-flow.spec.ts
  trip-tracking.spec.ts
  performance.spec.ts
  security.spec.ts
  uber-flow.spec.ts
  api/
  COVERAGE.md
test-manual.md
.github/workflows/test.yml
```

## Notes

- Screenshots + video retained on failure.
- Retries: 1 locally, 2 in CI.
- Do **not** run merchant signup tests against production.
- Manual checklist: [`test-manual.md`](./test-manual.md)
