# Installation, Onboarding & UX Confusion Audit

**Audited by:** Cursor agent (code + live prod probes + Playwright)  
**Date:** 2026-08-03  
**Live URL:** https://village-ride.vercel.app  
**Suite:** `tests/ux-confusion-audit.spec.ts`

> Physical phone install (home-screen icon feel, APK unknown-sources flow) cannot be completed from this agent environment. Those rows are marked **NEEDS PHONE**.

---

## Phase 1 — Installation

| # | Check | Result | Evidence |
|---|--------|--------|----------|
| A1 | Auto “Add to Home Screen” popup | ⚠️ **PARTIAL** | Chrome may fire `beforeinstallprompt` (captured in `pwa-install.ts`). iOS never auto-prompts — `/get-app` shows Share → Add to Home Screen steps. |
| A2 | Icon crisp, no white border | ❌ **FAIL** | `public/icons/icon-512.png` has a **thin white ring** around the black rounded square. Maskable uses same asset → risk of halo on Android. |
| A3 | Standalone (no URL bar) | ✅ **PASS** (config) | Live manifest: `"display":"standalone"`. Confirm on device after install. |
| A4 | Offline → app UI + banner | ⚠️ **PARTIAL** | `OfflineBanner` + SW precache `/` + icons. SW does **not** precache `/ride`, `/delivery`, etc. Airplane mode after first visit should show home + “You're offline…”, not a blank dinosaur — **verify on phone**. |
| B1 | `/get-app` Download APK | ✅ **PASS** | Live `200`, APK `~1.3MB`, `Content-Type: application/vnd.android.package-archive`. CTA label is “Download app” (not “Download APK”). |
| B2 | APK looks like PWA | ⚠️ **NEEDS PHONE** | Same WebView/PWA shell expected; not installed here. |
| B3 | APK updates | 📝 **KNOWN RISK** | Sideloaded APK won’t auto-update with Vercel deploys until Play Store. |

---

## Phase 2 — Driver onboarding

| # | Check | Result | Evidence |
|---|--------|--------|----------|
| 1 | `/driver/join` form | ✅ **PASS** | Form + photo uploads + code of conduct present. |
| 2 | Valid JPEG accepted | ✅ **PASS** (server) | `requireImageFile` allows JPEG/PNG ≤5MB. |
| 3 | Invalid file / fake `.jpg` rejected | ⚠️ **PARTIAL** | Server rejects wrong MIME **unless** `type === ""` and extension is `.jpg` — a renamed `.txt→.jpg` can slip through. Client `PhotoUploadField` has **no** size/type guard before submit. |
| 4 | Success copy matches script | ❌ **FAIL** | Actual: *“Application received… you cannot go online until you see ✓ Verified.”* Script wanted: *“approved to browse, human verifies before first paid trip.”* Also backend sets `approval_status: "approved"` + `verification_status: "pending"` — wording vs status is confusing. |
| 5 | Account shows Pending / Verified | ⚠️ **PARTIAL** | `/driver/account` shows chip **“Pending”** or **“Verified”** (not the words “Pending Verification”). Easy to miss vs Online toggle on Home. |

---

## Phase 3 — No-confusion UI

| # | Check | Result | Evidence |
|---|--------|--------|----------|
| A | Rider tabs = exactly 3 | ✅ **PASS** | **3 tabs:** Home · Activity · Account. Services moved to Home map pills (`service-pills.tsx`). |
| B | Driver tabs = Jobs / Earnings / Account | ✅ **PASS** | **3 tabs:** Jobs · Earnings · Account. Groups relocated to Account; map/online lives under Jobs (`/driver/home`). |
| B2 | Rider ↔ driver isolation | ✅ **PASS** | Rider `/` has no Driver nav; driver app under `/driver/*`. |
| C | Back keeps booking state | ⚠️ **PARTIAL / FAIL risk** | Browser back from `/ride` often leaves the booking route (Playwright annotation). Pickup/dropoff not in a durable multi-step history stack. |
| D | Fare breakdown before Book | ✅ **FIXED** (2026-08-03) | Ride + Courier now use the same `FareBreakdownCard` as Delivery/Farm (Base + Distance + Platform fee + Total). |

---

## Automated run (this session)

```text
tests/ux-confusion-audit.spec.ts  → 10 passed initially; join/offline selectors tightened
tests/onboarding.spec.ts + public-pages → 15 passed
Live: manifest standalone ✅, APK 200 ✅, sw.js 200 ✅, icon-512 has white border ❌
```

---

## Priority fixes (for a follow-up Cursor prompt)

1. **Simplify nav** — ✅ Done. Rider: Home / Activity / Account (Services → Home pills). Driver: Jobs / Earnings / Account (Groups → Account).
2. **Ride/Courier FareBreakdownCard** — same Base + km + fee lines as Delivery.
3. **Icon** — export maskable icon **without** white outer ring (full-bleed black).
4. **Driver apply copy + client file validation** — instant reject >5MB / non-image; success message matches browse-vs-paid-trip rule.
5. **Booking back stack** — keep pickup when leaving dropoff step (query params or session state).

---

## Phone checklist (you still need to do)

- [ ] Add to Home Screen on iPhone Safari + Android Chrome → confirm no URL bar  
- [ ] Airplane mode → open PWA → confirm offline banner (not Chrome dino)  
- [ ] Install APK from `/get-app` → open full screen  
- [ ] Upload a real ID photo + a 10MB file on `/driver/join`  

**Overall launch readiness for this script:** not green — nav clutter and ride fare opacity are the biggest first-time-user risks.
