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
- Logo file → `[none yet — placeholder]`  ____________________  *(drop the file in the repo and tell me the name, or send it)*
- Primary brand color (hex) → `[#1F4E79 navy placeholder]`  ____________________
- Secondary/accent color (hex) → `[#C8A45C gold placeholder]`  ____________________
- Tagline to print under the logo (optional) → `[none]`  ____________________

*(Company name, address, phone, website, Cal T 188960 are already locked in from your config.)*

---

## 2. Pricing policy
- **Standard discount off the tariff maximum** (the only lever that lowers price; 0% = always quote the legal max) → `[0%]`  ____________________
- **Minimum shipment weight** you'll quote (your business floor — *not* a tariff rule; tariff prices any weight) → `[5,000 lb]`  ____________________
- **Quote validity period** → `[30 days]`  ____________________

---

## 3. Accessorial charges — keep at tariff max, or set your own (lower)?
*For each: by default the app charges the 2026 tariff maximum (so you can never overcharge). Fill in only if you want to charge **less**.*

- **Shuttle** (smaller truck when the rig can't reach the door) — tariff basis is **hourly** (Item 320). Default uses the tariff hourly max (≈ **$234.39/hr** for a 2-person crew, Territory A).
  - Your shuttle hourly rate, if different → `[use tariff max]`  ____________________
  - Typical shuttle crew size → `[2 people]`  ____________________
- **Extra stop** (extra pickup/delivery) — tariff max is **$134.45 per stop**.
  - Your per-stop charge, if lower → `[use $134.45 max]`  ____________________
- **Bulky articles** — tariff sets a **per-article max** (e.g. autos $188.98, campers $274.28, grand piano $122.65; range $96.38–$334.55).
  - Use the tariff per-article maxima? → `[yes — use tariff table]`  ____________________
  - Any items you commonly charge for that need a custom amount (e.g. gun safe, hot tub) → `[none]`  ____________________

---

## 4. Valuation (liability coverage) — **one real decision + one to confirm**
- **THE QUESTION TO CONFIRM WITH BHGS / YOUR INSURER:** when a customer declares *no* value, is the default **Actual Cash Value up to $20,000** provided **free**, or is it **chargeable at $1.12 per $100** ($224)? The tariff text is ambiguous and it's real money.
  - What you find out → `[app will REQUIRE a signed choice until confirmed]`  ____________________
- Offer both upgrade tiers as-is? **FVRP-$250** ($0.67/$100) and **FVRP-$500** ($0.38/$100) → `[yes, offer both]`  ____________________
- Do you enforce a **minimum declared value** (optional, SVM-set; e.g. $/lb)? → `[no minimum]`  ____________________

---

## 5. Packing & materials
- Carton/box prices → use the **tariff (Item 340) maximum sale prices**, or your own? → `[use Item 340 max]`  ____________________
- **Materials sales-tax rate** (confirm with your accountant) → `[9.125% — Santa Clara, CONFIRM]`  ____________________
- Offer an **hourly packing-labor** option (vs. per-box), or per-box only? → `[per-box only for v1]`  ____________________

---

## 6. Payment & deposit terms (printed on the quote/agreement)
- **Deposit** required to book (amount or %, when due) → `[no deposit / salesperson enters per quote]`  ____________________
- **Accepted payment methods** → `[cash, check, card, money order]`  ____________________
- **Credit-card surcharge?** → `[none]`  ____________________
- **When is the balance due** → `[on delivery, before unloading, not to exceed the NTE]`  ____________________

---

## 7. Things to chase down (just check off when done — not blocking)
- [ ] BHGS/insurer: is the $20k ACV default chargeable? (Section 4)
- [ ] Accountant: materials sales-tax rate + handling (Section 5)
- [ ] Logo file + brand hex colors (Section 1)

---

*When you've filled in what you want (even just a few lines), tell me and I'll bake it into the v0.2 spec + config. Anything left blank uses the bracketed default — all safe, all adjustable later in the app's Settings.*
