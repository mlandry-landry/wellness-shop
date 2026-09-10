import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

import { readdirSync } from 'node:fs';

// Which store are we building? Priority: SITE_ID env var, then infer from the Vercel project name
// (projects are named hottubsin<city>, so no per-project env vars are needed), then fall back to kitchener.
const ids = readdirSync(new URL('./src/data/locations', import.meta.url)).map((f) => f.replace('.json', ''));
function inferSite() {
  if (process.env.SITE_ID) return process.env.SITE_ID;
  const hints = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(Boolean).join(' ').toLowerCase();
  return ids.find((id) => hints.includes(`hottubsin${id}`)) || 'kitchener';
}
const siteId = inferSite();
console.log(`[sites] building ${siteId}`);
const loc = JSON.parse(readFileSync(new URL(`./src/data/locations/${siteId}.json`, import.meta.url), 'utf8'));

export default defineConfig({
  site: `https://${loc.domain}`,
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap({ filter: (p) => !p.includes('/thank-you') })],
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: { define: { 'import.meta.env.SITE_ID': JSON.stringify(siteId) } }
});
