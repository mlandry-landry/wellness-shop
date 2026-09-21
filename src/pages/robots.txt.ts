import type { APIRoute } from 'astro';
import { siteUrl } from '@/lib/site';

// Per-store robots.txt so each domain advertises its own sitemap.
export const GET: APIRoute = () =>
  new Response(
    ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /thank-you/', 'Disallow: /voucher/', '', `Sitemap: ${siteUrl}/sitemap-index.xml`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
