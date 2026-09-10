import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

const siteId = process.env.SITE_ID || 'kitchener';
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
