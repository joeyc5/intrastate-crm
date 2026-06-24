# The Bar

A craft standard for building websites and apps that don't read as templated, don't lie, and don't break. Read this once. It is the difference between "correct" and "how is this even possible."

The whole standard reduces to three words: **considered, true, verified.**
- **Considered** — every choice is deliberate and specific to *this* subject. Nothing is a default.
- **True** — every claim, label, and number is real. The interface never lies, never fabricates, never decorates with fiction.
- **Verified** — you looked at it, measured it, and proved it works before you called it done. Evidence, not assumption.

If a thing you're about to ship fails one of those three, it isn't done.

---

## 1. Before you build: find the point of view

A page is an argument, not a container. Before any code:

- **Pin the subject in one sentence.** What is this, who is it for, and what is the single job of this screen? If the brief doesn't say, decide and state it. Specificity is the source of everything good; vagueness is the source of everything generic.
- **Write a thesis.** The hero is not "a big number and a gradient." It opens with the most characteristic, most emotionally true thing in the subject's world. Lead with that.
- **Name the one signature.** The single element this page will be remembered by. Spend your boldness *there*. Keep everything around it quiet and disciplined. (Coco Chanel: before you leave the house, take one thing off.)
- **Refuse the defaults.** Right now, templated/AI design clusters around three looks. If you find yourself reaching for one without a reason specific to the brief, stop:
  1. warm cream background + high-contrast serif + terracotta accent
  2. near-black background + one neon accent
  3. broadsheet layout: hairline rules, zero radius, dense newspaper columns
  These are legitimate *choices* and illegitimate *reflexes*. The test: would you arrive at the same design for a completely different subject? If yes, it's a reflex. Change it.
- **Brainstorm before you build, not while you build.** Decide the palette, the type pairing, the layout concept, and the signature *first*. Building is execution of a plan, not a place to discover one.

When the solution space is wide, generate several distinct directions, judge them against the brief (ideally with a fresh, adversarial eye), and synthesize the winner — grafting the best moves from the runners-up. One-attempt-iterated loses to many-attempts-judged.

---

## 2. Typography is the spine

Type carries more of the personality than color does. Treat it as the primary design system, not a delivery vehicle for text.

- **Pair deliberately.** A characterful display face used with restraint + a clean, neutral body face (+ a utility face for data/labels if needed). Do not reach for the same families you'd use on any other project.
- **Set a real scale.** A defined type scale with intentional weights, widths, and tracking. Big things are *confidently* big (use `clamp()` for fluid headlines). Small things are legible (16px minimum body; never sub-12px).
- **One emphasis move, used as a jewel.** A single italic/colored/weighted "punctuation word" inside a headline lands harder than five emphasis styles competing. Make it mean something.
- **Line length 60–75 chars** on desktop, 35–60 on mobile. Line-height ~1.5–1.7 for body. Headlines tighter (~1.0–1.1).
- **Optical detail.** Balance headlines (`text-wrap: balance`), avoid orphan/widow words, respect the font's real tracking, use tabular figures for columns/prices/timers so numbers don't jitter.
- **Render the real face.** If a surface generates images (social cards, OG, dynamic graphics), bundle the actual brand font — don't fall back to a system sans and call it on-brand.

---

## 3. Color and light: depth, not flat fills

- **Name a 4–6 color palette** as semantic tokens (ground, ink, accent, depth, …) defined in *one* place. Reference tokens, never raw hex in components. When a value changes, it changes once.
- **Light gives depth.** Flat color is the tell of a template. Use layered gradients, a key light, soft glows, grain, and shadow to make surfaces feel like they exist in space. A "ground" can have a direction and a time of day.
- **Color is never the only signal.** Functional color (error, success) pairs with an icon or text. Don't encode meaning in hue alone.
- **Contrast is computed, not eyeballed.** AA is 4.5:1 for normal text, 3:1 for large text and UI glyphs. Bright accents often *fail* as small text on tinted grounds — keep a darkened variant for small text and reserve the bright version for large display and fills. Never put light body text on a bright warm band; use dark ink. **Compute the ratio. A passing Lighthouse score does not prove contrast** — it skips invisible (animated-in) nodes.
- **Design light and dark together** if both exist; dark mode uses desaturated tonal variants, not inverted colors, and is contrast-tested separately.

---

## 4. Layout and hierarchy: structure encodes meaning

- **Hierarchy comes from scale, weight, light, and space — not decoration.** Numbered markers (01/02/03), uppercase tracked eyebrows, and dotted meta-rows are only appropriate when the content *is* an ordered sequence or the label carries real information. Most of the time they're noise pretending to be structure. Default to removing them.
- **Whitespace is intentional grouping**, not empty space. Use a consistent spacing scale (4/8px rhythm). Define vertical-rhythm tiers and stick to them.
- **Mobile-first, then scale up.** Systematic breakpoints. No horizontal scroll, ever. Test 375–390px and landscape. Verify there's no overflow (`scrollWidth <= innerWidth`).
- **Reserve space for async content** (set image dimensions / aspect-ratio) so nothing shifts on load (CLS < 0.1).
- **Photography is framed, not cropped to death.** Respect the source aspect ratio; cropping a landscape into a tall portrait throws away the photo and reads as low-res. Real, specific imagery beats stock and beats placeholder gradients.

---

## 5. Motion: one orchestrated moment beats scattered effects

- **Every animation expresses cause and effect.** Decorative motion is the fastest way to read as AI-generated. If it doesn't convey state, hierarchy, or continuity, cut it.
- **One choreographed moment** (a page-load sequence, a scroll-triggered reveal, a shared-element transition) lands harder than effects sprinkled everywhere.
- **Timing:** 150–300ms micro-interactions; exits ~60–70% of enter duration; ease-out entering, ease-in leaving; spring/physics curves feel more natural than linear. Animate `transform`/`opacity` only — never width/height/top/left.
- **Interruptible and non-blocking.** A user gesture cancels an in-progress animation; input is never blocked by motion.
- **Respect `prefers-reduced-motion`** — always. And remember smooth-scroll libraries hijack programmatic scroll; account for it when testing.

---

## 6. Function and truth: the engineering bar

Beauty that lies or breaks is not beauty.

- **Never fabricate.** Every stat, name, credential, date, quote, and superlative is sourced from a single source of truth. If a fact isn't there, you don't invent it — you ask, or you cut it. "Probably true" is a fabrication. This is the line you never cross; an interface that misstates the world is worse than an ugly one.
- **Words are design material.** Name things by what the user controls, not how the system is built. Active voice; an action keeps its name through the whole flow (the button that says "Publish" produces "Published"). Errors state cause *and* fix, in the product's voice, never apologizing or vague. Empty states invite an action. Copy is where a generic design and a generic *product* both leak — write it with the same care as spacing.
- **Semantic, accessible HTML.** One `h1`; no skipped heading levels; labels tied to inputs; `alt` on meaningful images; visible focus rings (never removed); full keyboard support; icon-only buttons get accessible labels; touch targets ≥ 44px.
- **Server-render safely.** Default to server components; add client interactivity only where required. Animated reveals must be visible-by-default and *enhance* — never `opacity: 0` gated purely on JS, or the page is blank if the script hiccups (and screen readers/SEO see nothing).
- **State the performance trade-off, don't make it silently.** Default to fast (modern image formats, lazy-load below the fold, code-split, font-display swap). When a brief says "beauty over performance," spend it deliberately on craft — but never spend the *accessibility* floor. A11y is not performance; it always holds.
- **No silent failure and no silent truncation.** If you cap coverage (top-N, sampling, "we'll do the rest later"), say so. Silence reads as "handled."

---

## 7. Attention to detail: the 1% that is 50% of the feel

This is what separates work that's correct from work that makes people ask how it was done. None of it is optional at the bar.

- Every interactive element has **hover, focus, active, and disabled** states that are visually distinct and on-style.
- Every screen has its **empty, loading, and error** states designed — not just the happy path.
- **Optical alignment** over mathematical alignment; icons sit on the text baseline; consistent icon set, stroke width, and corner radius (SVG, never emoji as structural icons).
- **One elevation/shadow scale** for cards/sheets/modals — no random shadow values.
- **Numbers don't jitter** (tabular figures), prices/dates/units are locale-aware, counters animate from a real SSR value.
- **No orphan words**, no awkward line breaks in headlines, no two adjacent elements touching where a space belongs.
- **The primary action is singular** per screen; secondary actions are visually subordinate.
- **Captions, micro-labels, and footnotes** get the same care as the headline — they're where polish is usually abandoned.
- The **favicon, social card, manifest theme color, and error pages** match the brand. The surfaces nobody designs are exactly where "templated" hides.

---

## 8. Verification: how you actually know it's good

The most senior move in this whole document. Most failures are confidently-wrong, not obviously-wrong.

- **Orient with evidence first.** Read the real code/content/data before deciding anything. Don't design blind.
- **Look at it.** Take screenshots. A picture is worth a thousand tokens. Render every key surface and every breakpoint; don't trust that it looks the way you imagined.
- **Don't trust a stale tool.** Dev servers cache; a held port serves an old build; a "clean restart" sometimes isn't. If a change should have visibly landed and didn't, suspect the cache/server before you suspect your code — confirm the rendered, computed result (a real screenshot, a computed style, a production build), not the source you *think* is running.
- **Adversarially verify claims.** Before declaring a thing real/correct/done, try to *refute* it. Spawn an independent skeptic if the stakes are high. A passing self-test is not evidence the underlying claim is true; it's evidence your test checks something.
- **Evidence before assertions, always.** Run the build. Read the output. If tests fail, say so with the output. "It compiles / it's verified / it's done" are claims you must back with a command result you actually ran. Make the deliverable durable (write the file, commit) *before* the long verification step, so a result survives even if the step dies.

---

## 9. The anti-patterns (if you see these, you missed the bar)

- A hero that leads with a stat and a gradient instead of the subject's most characteristic thing.
- Decoration masquerading as structure (eyebrows, numbered markers, dividers that encode nothing).
- Flat single-color fills where light and depth belong.
- Emphasis everywhere (so emphasis nowhere).
- Motion that doesn't mean anything.
- Light text on a bright ground; bright accent as small body text; contrast "checked" only by a Lighthouse score.
- Invented facts, padded copy, placeholder lorem shipped as real.
- `opacity: 0` reveals with no fallback; removed focus rings; emoji icons.
- The 404/social-card/favicon left in the old style after a redesign.
- "Done" declared without a screenshot, a build, or a measured result.

---

## Pre-ship checklist

- [ ] One clear thesis; one memorable signature; nothing reads as a default.
- [ ] Type scale, pairing, and the single emphasis move are deliberate.
- [ ] Palette is tokenized; surfaces have depth; contrast is **computed** and passes AA.
- [ ] Responsive 375px → desktop, landscape included; no horizontal overflow; no layout shift.
- [ ] Motion is purposeful, interruptible, and respects reduced-motion.
- [ ] Hover/focus/active/disabled + empty/loading/error states all designed.
- [ ] Keyboard, focus rings, alt text, labels, heading order — all correct.
- [ ] Every fact is sourced and true; copy is active, specific, and in the product's voice.
- [ ] Favicon, OG/social card, manifest, and error pages match the brand.
- [ ] You looked at every surface, ran the build, and have the evidence to say it's done.

The bar isn't a style. It's the refusal to ship anything you haven't made deliberate, proven true, and seen with your own eyes.
