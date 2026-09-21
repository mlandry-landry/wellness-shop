# Wellness Shop regional sites

One Astro codebase, six deployments. Each Vercel project is named `hottubsin<city>` and the build infers the store
from the project name (or from a `SITE_ID` env var if set). Each project gets its own domain. Every push to `main` rebuilds all six.

| Site | Domain |
|---|---|
| hamilton | hottubsinhamilton.ca |
| whitby | hottubsinwhitby.ca |
| burlington | hottubsinburlington.ca |
| barrie | hottubsinbarrie.ca |
| kitchener | hottubsinkitchener.ca |
| london | hottubsinlondon.ca |

## Where to change things

| Want to... | Edit |
|---|---|
| Change a price, bi-weekly payment, spec or note | `src/data/products.json` (or update `data-source-catalog.xlsx` and run `npm run products`). Clearlight sauna prices are NOT taken from the spreadsheet (its sauna tab was wrong); they live in the `CLEARLIGHT` table at the top of `scripts/build-products.py`, verified against wellnessshop.ca on Sep 10, 2026. |
| Change the hero headline, promo banners (home strip + specials page), financing line | `src/data/promos.json` (`banners[]`: label, text, cta, href, icon tag/truck/pool/sauna, endsOn) |
| Add, edit, pause or expire an in-store special | `src/data/specials.json`. Each card has: `badge` (small label), `value` (big header line, 2 or 3 words like `Save $7,300` or `Free`), `valueSub`, `title`, `summary`, up to 3 `details`, `claimCode` (null = no code), `endsOn`, `locations`, `active` |
| Change a store's phone, tracking number, hours, address, staff, service towns, local copy, or what its home page leads with (`homeFocus`: hot-tub, sauna or swim-spa) | `src/data/locations/<site>.json` (hero variants per focus live in `promos.json` -> `heroByFocus`) |
| Swap or add a product image | `public/images/products/<slug>.webp` |
| GTM / GA4 container per store | `src/data/locations/<store>.json` -> `gtmId` (each store has its own GTM container and GA4 property; `site.json` `analytics.gtmId` is only a fallback) |

Commit and push. Vercel redeploys all six in about a minute each.

## Pages per site

Home, `/hot-tubs/` (+36 product pages), `/swim-spas/` (+15), `/saunas/` (+9), `/cold-plunge/`, `/massage-chairs/`, `/gazebos/`,
`/in-store-specials/`, `/price-list/`, `/financing/`, `/showroom/`, `/service-areas/<town>/` (10 per store), `/thank-you/`, `/privacy/`.
Sitemap at `/sitemap-index.xml`. Schema.org LocalBusiness on every page, Product/Offer on product pages, FAQPage, OfferCatalog on specials.

## Leads

`POST /api/lead` (Vercel function). Every lead is stamped with `storeId`, `source` and `page`, then:
1. Posted to Salesforce Web-to-Lead when `SALESFORCE_WEB_TO_LEAD_OID` is set (mapping in `src/lib/salesforce.ts`: Closest Location picklist per store, Interested In, Entry Type = Lead Form, Lead Source = Website, Source, Lead Source - Digital, Pardot Page, UTM/GCLID/FBCLID, Submitter IP, description with product, voucher and message)
1b. POSTed as JSON to `LEAD_WEBHOOK_URL` if set (Zapier, Make, a Pardot form handler relay, etc.)
2. Emailed via Resend if `RESEND_API_KEY` + `LEAD_TO_EMAIL` are set
3. Always written to the Vercel function log

Client events pushed to `dataLayer`: `call_click`, `directions_click`, `specials_click`, `product_cta`, `lead_submit`, `lead_thank_you`, each with `store_id`.

## Local

```
npm install
SITE_ID=barrie npm run dev
npm run build:all   # builds all six into dist-all/
```

## Claim flow and Red Tag vouchers

Every offer card has a **Claim this offer** button. It opens a modal (name, mobile, email, planned visit), posts the lead to `/api/lead`
with `source: claim:<special id>` plus a per-person `voucherCode` (`<claimCode>-XXXX`, the suffix derived from the phone number) and
`voucherExpires` (claim time + `voucherDays`, capped by the special's `endsOn`). The visitor lands on `/voucher/`, a Red Tag styled ticket
with their name, code, live countdown, QR to the same page, store address and hours, terms, plus Directions / Call / Add visit reminder (.ics) / Print.
The voucher is also stored in `localStorage`, so `/voucher/` with no query string shows it again. When `RESEND_API_KEY` is set the
customer also gets an email with the voucher link, and the store email subject reads "VOUCHER CLAIMED".

- Slide-in prompt: `ClaimPrompt.astro` offers the first active special after 45% scroll or 25s, once per 7 days, never to someone who already holds a voucher.
- Site-wide sale countdown bar: `promos.json` -> `sale` (`active`, `name`, `endsOn`, `text`). Off by default; set a real date before enabling.
- Red Tag motif: `RedTag.astro` (SVG). Used in the hero; drop the real Red Tag artwork into `public/images/brand/` to swap it in.
- Deep link to open a claim: `/in-store-specials/?claim=<special id>` (handy for GBP posts, SMS and ads).
- Events: `claim_open`, `claim_submit`, `voucher_view`, `claim_prompt_view`, `salebar_click`.

## Product finder quiz

`/find-my-hot-tub/` (also `?type=hot-tub|swim-spa|sauna` to skip the first question). Four or five taps, no email required:
hot tubs ask people / lounger vs open / budget / priority; swim spas ask use / length / budget; saunas ask indoor vs outdoor / people / budget.
Scoring runs client-side over `products.json` (seats fit, seating type, budget band, then a priority bonus: jets per seat, 110V plug-in,
insulation and water care, savings ratio and price per seat, or premium series). Results show a top match with three plain-language reasons,
a step-up and a step-down alternative, "Book a wet test" (opens the claim modal) and an optional "Email my matches" form that sends the
answers and picks to the lead handler as `source: quiz`. Events: `quiz_start`, `quiz_step`, `quiz_complete`.
To tune the recommendations edit the `scoreHotTub` / `scoreSwim` / `scoreSauna` functions in `src/pages/find-my-hot-tub.astro`.

## Analytics (GTM + GA4)

Each store has its own Google Tag Manager container and GA4 property (Tag Manager account "Wellness Shop", GA4 account "Aquatic Home Living Ontario Inc."). The container id lives in `src/data/locations/<store>.json` -> `gtmId`.

| Store | GTM container | GA4 measurement id |
|---|---|---|
| Hamilton | GTM-KL4N34B | G-80CLE6BS01 |
| Whitby | GTM-MXXZ4WT | G-JY4HQ7S641 |
| London | GTM-T54MNSJ | G-GR6JCWHN9J |
| Burlington | GTM-TL59G3K | G-3MVJVZL79C |
| Barrie | GTM-WD6CMXS | G-QM1XXGN3KQ |
| Kitchener | GTM-NXQFDGW | G-8YN7JM7EXE |

The site pushes dataLayer events via `window.wsTrack` (see `src/layouts/Base.astro`): call_click, directions_click, specials_click, product_cta, promo_click, salebar_click, lead_submit, lead_thank_you, claim_open, claim_submit, claim_prompt_view, voucher_view, quiz_start, quiz_step, quiz_complete. Every event carries store_id and store_name.

`node scripts/build-gtm-import.mjs` writes `gtm/<store>.json`, a GTM container import (Admin > Import Container > Default Workspace > Merge) that adds: data layer variables, a GA4 measurement id constant, custom event triggers, a "GA4 Event - Wellness Shop site events" tag (event name = {{Event}}, parameters store_id, store_name, phone_number, click_location, lead_source, special_id, quiz_step, quiz_type, recommended_product) and a "generate_lead" tag fired on lead_submit and claim_submit. When new events are added to the site, add them to EVENTS in that script, regenerate, re-import and publish.
