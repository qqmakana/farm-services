# Village Ride — Manual Testing Checklist

Use this after deploys. Prefer a phone (Chrome) + desktop.

Production: https://village-ride.vercel.app

---

## Public Pages
- [ ] Homepage loads (`/`)
- [ ] Partners page loads (`/partners`) — Sign up CTA works
- [ ] Help / FAQ loads (`/help`)
- [ ] Shop / signup page loads (`/shop`)
- [ ] Trip tracking loads for a real code (`/trip/RU-XXXX`)
- [ ] Invalid trip code does not crash
- [ ] Nav shows **Partners** link

## Merchant Flow
- [ ] Can signup with valid business data
- [ ] Signup validation blocks empty required fields
- [ ] Dashboard loads after signup / login
- [ ] Onboarding checklist shows for new merchants
- [ ] Stats show Total / Pending / Completed / Fees
- [ ] Can create delivery (pickup = shop)
- [ ] Can schedule delivery for later
- [ ] Orders list updates after create
- [ ] Driver name + star rating shows when assigned
- [ ] Share trip link copies `/trip/[code]`
- [ ] Weekly report generates
- [ ] Referral code visible
- [ ] Can share referral link (`/shop?ref=CODE`)
- [ ] No-drivers banner appears when dispatch exhausted (if reproducible)

## Driver Flow
- [ ] Can open `/driver` and enter app (or auth login)
- [ ] Can Go Online / Go Offline
- [ ] Push permission / FCM prompt works
- [ ] Sees pending offer for new jobs
- [ ] Can ACCEPT order
- [ ] Can Start Trip
- [ ] Can Complete Trip
- [ ] Commission (~15%) deducted from wallet
- [ ] Earnings page updates
- [ ] Can rate customer after trip
- [ ] Customer can rate driver on trip page

## Edge Cases
- [ ] No drivers available → merchant banner / trip message
- [ ] Schedule for later → order marked scheduled
- [ ] Network offline → graceful error (DevTools offline)
- [ ] Invalid phone / empty form → validation errors
- [ ] Unauthorized `/merchant/dashboard` → login redirect (production)
- [ ] Unauthorized `/admin/*` → login redirect (production)

## Mobile (320–768px)
- [ ] All public pages usable
- [ ] Merchant create delivery form usable
- [ ] No horizontal scroll
- [ ] Touch targets tappable
- [ ] Readable font sizes

## Ops / Trust
- [ ] `/dispatch` loads for dispatcher role
- [ ] `/admin/verifications` approve/reject works
- [ ] Driver cannot Go Online until verified (after TRUST_SAFETY.sql)

---

## Sign-off
| Role | Name | Date | Pass? |
|------|------|------|-------|
| Tester | | | |
| Owner | | | |
