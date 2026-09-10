# Wellness Shop regional sites

One Astro codebase, six deployments. Each Vercel project sets `SITE_ID` to one of
`hamilton | whitby | burlington | barrie | kitchener | london` and gets its own domain.
Every push to `main` rebuilds all six.

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
| Change a price, weekly payment, spec or note | `src/data/products.json` (or update `data-source-catalog.xlsx` and run `npm run products`) |
| Change the hero headline, sale banners, financing line | `src/data/promos.json` |
| Add, edit, pause or expire an in-store special | `src/data/specials.json` (`active`, `locations`, `endsOn`, `claimCode`) |
| Change a store's phone, tracking number, hours, address, staff, service towns, local copy | `src/data/locations/<site>.json` |
| Swap or add a product image | `public/images/products/<slug>.webp` |
| Turn on GTM / GA4 | `src/data/site.json` -> `analytics.gtmId` |

Commit and push. Vercel redeploys all six in about a minute each.

## Pages per site

Home, `/hot-tubs/` (+36 product pages), `/swim-spas/` (+15), `/saunas/` (+9), `/cold-plunge/`, `/massage-chairs/`, `/gazebos/`,
`/in-store-specials/`, `/price-list/`, `/financing/`, `/showroom/`, `/service-areas/<town>/` (10 per store), `/thank-you/`, `/privacy/`.
Sitemap at `/sitemap-index.xml`. Schema.org LocalBusiness on every page, Product/Offer on product pages, FAQPage, OfferCatalog on specials.

## Leads

`POST /api/lead` (Vercel function). Every lead is stamped with `storeId`, `source` and `page`, then:
1. POSTed as JSON to `LEAD_WEBHOOK_URL` if set (Salesforce lead handler, Zapier, Make, etc.)
2. Emailed via Resend if `RESEND_API_KEY` + `LEAD_TO_EMAIL` are set
3. Always written to the Vercel function log

Client events pushed to `dataLayer`: `call_click`, `directions_click`, `specials_click`, `product_cta`, `lead_submit`, `lead_thank_you`, each with `store_id`.

## Local

```
npm install
SITE_ID=barrie npm run dev
npm run build:all   # builds all six into dist-all/
```
