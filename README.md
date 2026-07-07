# Travler — demo storefront for Spotler Activate

Static package-holiday webshop (EN/NL) used to demo Spotler Activate. Built on the
Shopler foundation: same architecture, same simplicity, same demo behaviour — reskinned,
renamed and re-worded for a travel vertical. Open `index.html` directly in a browser, or
serve the folder — no build step, no backend.

## Build

- Plain HTML/CSS/JS, hash-routed. Runs from `file://`.
- `tokens.css` — brand design tokens (single source of truth; swap values to rebrand,
  keep the variable names).
- `app.css` — storefront styles (only references `var(--…)` tokens).
- `app.js` — routing, booking basket, checkout wizard, i18n, tracking, consent.
- `trips.default.js` — the 24-trip catalogue (`window.TRIPS_DEFAULT`), loaded as a
  `<script>` so the app reads data without `fetch()` (blocked on `file://`).
- `trips.js` — admin-editable override layer, **empty** in this build (see "Not built
  in this version" below). When empty, `app.js` falls back to `TRIPS_DEFAULT`.
- `images/` — real photography (49 files: 1 hero + 24 trips × primary/lifestyle). See
  `IMAGE_REQUIREMENTS.md` for what was requested/delivered. Every `<img>` still falls
  back to a category-tinted inline SVG placeholder if a file is ever missing.
- `assets/` — the Travler monogram (SVG favicon/logo mark).
- `activate-feed-nl.xml` / `activate-feed-en.xml` — the two trip feeds Activate reads
  (RSS 2.0, one language each, with `date_availability`). `activate-feed.json` is a
  debug mirror only — Activate's Source must point at the XML files.
- `scripts/build-feeds.mjs` — regenerates the three feed files from `trips.default.js`.
  Run `node scripts/build-feeds.mjs [baseUrl]` after editing the catalogue.

## No personalisation in this build

Every Activate surface is an EMPTY container marked `data-activate="<slot>"`:
`recognition-banner`, `hero`, `rec-picked`, `email-capture`, `card-badge`, `rec-related`,
`pdp-social`, `checkout-crosssell` (the eight canonical Shopler slot names). Spotler
Activate fills them at runtime. This build never invents recommended/popular/welcome-back
content — "Popular right now" and "Last-minute deals" are deterministic (sorted by
`popularity` / filtered by `lastMinute`), and "Recently viewed" / "Saved trips" are the
visitor's own client-side state, not personalisation.

Product/trip elements carry `data-product-sku` (cards and the PDP container) so Activate
can locate them for card-badge and product-lister personalisations.

## Tracking

The Spotler Activate tracker snippet lives in `<head>` (loader-only) and creates
`window._sqzl`. `app.js` pushes the standard Squeezely event vocabulary — `PageView`,
`ViewContent`, `ViewCategory`, `Search`, `InitiateCheckout`, `AddToCart`,
`RemoveFromCart`, `PrePurchase`, `Purchase`, `EmailOptIn`, plus `AddToWishlist` for
saved trips — with travel date fields (`checkin_date`/`checkout_date`/`amount_nights`)
carried where a search has set them. A `{ event: "PageReload" }` push fires on every
soft (hash) navigation after the first render, since Activate only evaluates the first
load itself. Consent (`grant`/`revoke`/`permissions`) is replayed on every route before
any other event fires.

**PLACEHOLDER TRACKER ID.** `index.html` ships `SQ-TRAVLER-PLACEHOLDER` — replace it with
the real Travel-ICP merchant ID before go-live. That merchant needs "Travel enabled" on
(for `checkin_date`/`checkout_date`), EUR, and merge-on-User-ID on.

## Not built in this version

- **`#/admin` catalogue manager.** Shopler has an internal catalogue editor that commits
  `products.json`/`products.js`/feeds straight to GitHub. It was not ported — not needed
  for the five demo scenarios (see the build spec's "Open items to confirm"). `trips.js`
  is the empty override layer it would normally write to; regenerate feeds with
  `scripts/build-feeds.mjs` instead of the admin's "Save to GitHub".

## Running the five demo scenarios

1. **Anonymous becomes known.** Home → fill in the "Get price alerts" email form →
   `EmailOptIn` fires and `travler_email` is set.
2. **Returning visitor.** View a few city-break trips, then return to the home page —
   the real "Recently viewed" rail shows them; `recognition-banner`/`hero`/`rec-picked`
   stay empty until an Activate account fills them.
3. **Search but no booking.** Use the home search box (e.g. "Antalya"), open a couple of
   results (`ViewContent`), save one (heart icon → `AddToWishlist`), don't check out.
4. **Add-ons increase value.** Open a trip → "Start booking" (`InitiateCheckout`) → step
   through to "Add extras" → add one (`AddToCart`) — the `checkout-crosssell` slot sits
   alongside it.
5. **Availability alert.** Open a trip with 3 or fewer rooms left (e.g. Santorini,
   Crete) → "Tell me when this trip is available again" → `EmailOptIn` with
   `trigger:"availability_alert"`.

Inspect `window._sqzl` in the console at any point to see every event pushed so far.

## Fonts

Bricolage Grotesque / Hanken Grotesk / JetBrains Mono via Google Fonts; degrades
gracefully to system fonts offline.
