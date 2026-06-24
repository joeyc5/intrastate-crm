# SVM Quote App — Business Intake Questionnaire

**Purpose:** capture the handful of choices only you/SVM can make, so I can write the v0.2 spec. Everything from the tariff is already handled — this is just *your* business inputs.

**How to use:** fill in the blanks. **Every line has a recommended default in `[brackets]` — leave a line blank and I'll use the default.** Type your answer after `→`. Save the file and tell me "done" (or just paste your answers back to me). No need to answer all of it; partial is fine.

---

## ✅ Already decided (no action — just so you know)
- **Tariff edition:** MAX4 effective **Jan 1, 2026** (corrected from the stale 2025 the spec had).
- **Mileage basis:** **GPS / Google** shortest-highway distance (now allowed by Item 40). No Distance Table 8 needed.
- **Your territory:** San Jose HQ = **Territory A** (affects packing-labor rates automatically).

---

## 1. Brand & letterhead (for the quote + paperwork design)
- Logo file → **PROVIDED 2026-06-24** (wordmark: "SILICON VALLEY" red / "MOVING & STORAGE" blue). *⚠️ Still need the actual file committed to the repo (`/public/logo.svg` or `.png`) so the app & PDF can embed it — pasting it in chat doesn't put it on disk. Drop it in and tell me the filename.*
- Primary brand color (hex) → **red — approx `#E11B22` (CONFIRM exact from file)**
- Secondary/accent color (hex) → **blue — approx `#1B6CC9` (CONFIRM exact from file)**
- Tagline to print under the logo (optional) → `[none]`  ____________________

*(Company name, address, phone, website, Cal T 188960 are already locked in from your config.)*

---

## 2. Pricing policy
- **Standard discount off the tariff maximum** (the only lever that lowers price; 0% = always quote the legal max) → `[0%]`  ____________________
- **Minimum shipment weight** you'll quote (your business floor — *not* a tariff rule; tariff prices any weight) → `[5,000 lb]`  ____________________
- **Quote validity period** → **30 days ✓ (confirmed)**

---

## 3. Accessorial charges — keep at tariff max, or set your own (lower)?
*For each: by default the app charges the 2026 tariff maximum (so you can never overcharge). Fill in only if you want to charge **less**.*

> **Joey 2026-06-24:** "default to tariff max / typical, adjust in-app. The specific rates can be adjusted later — the framework is what's important." → **Every accessorial ships at its tariff-max default; all editable in Settings (clamped to the cap).**

- **Shuttle** (smaller truck when the rig can't reach the door) — tariff basis is **hourly** (Item 320). Default uses the tariff hourly max (≈ **$234.39/hr** for a 2-person crew, Territory A).
  - Your shuttle hourly rate, if different → **use tariff max (adjust later)**
  - Typical shuttle crew size → **2 people (default)**
- **Extra stop** (extra pickup/delivery) — tariff max is **$134.45 per stop**.
  - Your per-stop charge, if lower → **use $134.45 max (adjust later)**
- **Bulky articles** — tariff sets a **per-article max** (e.g. autos $188.98, campers $274.28, grand piano $122.65; range $96.38–$334.55).
  - Use the tariff per-article maxima? → **yes — use tariff table (adjust later)**
  - Joey named two: **Piano $150**, **Safe $300**. ⚠️ **Compliance notes (verified vs MAX4 2026, Item 164 full text):**
    - **Piano** → bulky-article max is **$122.65** (Item 164: "all pianos/organs any size"). A flat $150 exceeds the no-stairs ceiling. The lawful model = **$122.65 bulky charge + Item 140 piano-flight charges per actual flight** ($39.30 first / $19.71 each add'l / $0.90 per step). The engine computes this; ~$150 falls out naturally when stairs exist.
    - **Safe** → **NOT a named Item 164 article — there is no flat "safe fee" basis in the tariff.** A safe's cost is captured by (a) its **weight** in weight×distance (safes are dense → big line-haul), plus (b) **Item 140 flights/long-carry** for stair/distance labor, plus (c) **Item 168 Rigging/Hoisting** (charged at Item 320 hourly) for true heavy-rig handling. **Item 168 is currently OUT of v1 scope** — if SVM charges for safes often, consider pulling Item 168 into v1 (that's the only lawful home for a ~$300 heavy-safe handling charge). **No flat "safe" config field** — it would bake in a non-compliant add-on.

---

## 4. Valuation (liability coverage) — **one real decision + one to confirm**
- **THE QUESTION TO CONFIRM WITH BHGS / YOUR INSURER:** when a customer declares *no* value, is the default **Actual Cash Value up to $20,000** provided **free**, or is it **chargeable at $1.12 per $100** ($224)? The tariff text is ambiguous and it's real money.
  - What you find out → `[app will REQUIRE a signed choice until confirmed]`  ____________________
- Offer both upgrade tiers as-is? **FVRP-$250** ($0.67/$100) and **FVRP-$500** ($0.38/$100) → `[yes, offer both]`  ____________________
- Do you enforce a **minimum declared value** (optional, SVM-set; e.g. $/lb)? → `[no minimum]`  ____________________

---

## 5. Packing & materials
- Carton/box prices → use the **tariff (Item 340) maximum sale prices**, or your own? → **use Item 340 max (left blank → default; adjust later)**
- **Materials sales-tax rate** (confirm with your accountant) → **Santa Clara County sales tax ✓ (use Santa Clara point-of-sale rate, ≈9.125% as of 2026-06; stored as config, NOT hardcoded — accountant to confirm exact)**
- Offer an **hourly packing-labor** option (vs. per-box), or per-box only? → `[per-box only for v1]`  ____________________

---

## 6. Payment & deposit terms (printed on the quote/agreement)
- **Deposit** required to book (amount or %, when due) → `[no deposit / salesperson enters per quote]`  ____________________  *(not specified — using default; confirm later)*
- **Accepted payment methods** → **all major credit cards, bank transfer (ACH/wire), check ✓**
- **Credit-card surcharge?** → `[none]`  ____________________  *(not specified — assuming none; confirm if you pass card fees on)*
- **When is the balance due** → `[on delivery, before unloading, not to exceed the NTE]`  ____________________

---

## 7. Things to chase down (just check off when done — not blocking)
- [ ] BHGS/insurer: is the $20k ACV default chargeable? (Section 4) — **still open**
- [ ] Accountant: confirm exact Santa Clara County sales-tax rate + handling (Section 5) — **county confirmed; exact rate pending**
- [~] Logo: wordmark received 2026-06-24; **still need the file committed to the repo + exact brand hex** (Section 1)
- [ ] **Scope decision:** pull **Item 168 (Rigging/Hoisting)** into v1 so safes/heavy single items have a lawful charge basis? (Section 3)

---

*When you've filled in what you want (even just a few lines), tell me and I'll bake it into the v0.2 spec + config. Anything left blank uses the bracketed default — all safe, all adjustable later in the app's Settings.*
