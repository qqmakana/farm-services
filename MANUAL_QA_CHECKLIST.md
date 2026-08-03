# Village Ride — Comprehensive Manual QA Checklist

Aligned with the **current** build (`src/lib/pricing.ts` + `rr_service_pricing`).  
Book CTA is brand green `#0ECB81`. Fonts: Source Sans / Space Grotesk (not Inter).

**Tested by:** Cursor agent  
**Date:** 2026-08-03  
**Build / URL:** local mock `127.0.0.1:3100`  
**Status:** ☑ PASS ☐ FAIL  

### Automated run (this session)

| Suite | Result |
|-------|--------|
| `npm run test:logic` | **16/16 passed** |
| `tests/comprehensive-validation.spec.ts` | **36/36 passed** |

**Total: 52 automated checks passed.**

```bash
npm run test:logic
npm run test:e2e:comprehensive
```

---

## Pricing accuracy (ZA)

### Ride & Courier (no weight)
- [ ] 5km = **R70** (R15 + R50 + R5)
- [ ] 10km = **R120** (R15 + R100 + R5)
- [ ] 20km = **R220** (R15 + R200 + R5)
- [ ] 1km / short = driver min **R25** → total **R30** with fee

### Delivery (weight bands @ 10km)
- [ ] Light = **R145** (R20 + R120 + R5)
- [ ] Medium = **R190** (R35 + R150 + R5)
- [ ] Heavy = **R265** (R60 + R200 + R5)
- [ ] Extra Heavy = **R405** (R100 + R300 + R5)

### Farm (weight bands @ 10km)
- [ ] Light = **R180** (R25 + R150 + R5)
- [ ] Medium = **R225** (R40 + R180 + R5)
- [ ] Heavy = **R325** (R70 + R250 + R5)
- [ ] Extra Heavy = **R475** (R120 + R350 + R5)

### UI
- [ ] Delivery/Farm: weight category selector (Light → Extra Heavy)
- [ ] Fare breakdown shows Base / Distance / Platform fee / Total
- [ ] Courier has **no** weight selector

---

## Payment flows

### Cash
- [ ] “Pay the driver in cash” message
- [ ] Driver YES → platform fee deducted from wallet (flat fee, not 15%)
- [ ] Driver NO → flagged for ops, no deduction
- [ ] Village Pass cash trip → **R0** wallet deduction

### Card (PayPal)
- [ ] Card selector → PayPal checkout
- [ ] Capture → trip paid online *(live PayPal)*
- [ ] Complete → driver credited `(total − platform fee)` *(live PayPal)*

### Village Pass
- [ ] R99/mo subscribe UI (web PayPal, not Play Billing)
- [ ] Active Pass → platform fee **R0**
- [ ] Driver keeps 100% of driver fare
- [ ] Status visible on account

---

## Multi-country

| Market | Currency | Ride base | Notes |
|--------|----------|-----------|--------|
| ZA | R | R15 | Johannesburg-area map |
| NG | ₦ | ₦1,500 | Lagos (bands scale from ZA) |
| KE | KSh | KSh 300 | Nairobi |
| IN | ₹ | ₹100 | India |
| BR | R$ | R$15 | São Paulo |

- [ ] Country lock via Account / welcome (not GPS-only)
- [ ] `country-indicator` shows currency
- [ ] Phone placeholder matches market

---

## Uber-style UI

- [ ] Full-bleed map, no Leaflet zoom controls
- [ ] Pickup ● / dropoff ■ markers
- [ ] Floating Where to? bar + bottom sheet + drag handle
- [ ] Book CTA **green** `#0ECB81` (not black)
- [ ] Fonts Source Sans / Space Grotesk (not Inter)

---

## Security & privacy

- [ ] Production merchant/admin require login
- [ ] Drivers cannot see other drivers’ wallets via API
- [ ] Delete account flow *(manual if present)*

---

## Edge cases

- [ ] Offline cash booking queues
- [ ] Post-paid: start at R0, go online with empty wallet
- [ ] Wallet below −R100 blocks dispatch / go online / accept
- [ ] Top Up Wallet WhatsApp prefill includes Driver ID
- [ ] Invalid / negative distance → min fare path

---

## Performance / devices

- [ ] Map usable within ~3–8s on decent network
- [ ] Fare quote feels instant
- [ ] Chrome Android / Safari iOS smoke
- [ ] PWA install optional

---

## Final sign-off

- [ ] Pricing correct for all 4 services + weight bands  
- [ ] Cash / Card / Pass scenarios understood  
- [ ] Multi-country lock OK  
- [ ] No blocking console errors on happy paths  
- [ ] Ready for staged launch  

**Notes:** ___________________________________
