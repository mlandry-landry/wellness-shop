import type { APIRoute } from 'astro';
import { allLocations } from '@/lib/site';
export const prerender = false;

/**
 * Lead handler. Every submission is stamped with the store id and source, then:
 *  1. POSTed as JSON to LEAD_WEBHOOK_URL if set (Salesforce lead handler, Zapier, Make, GoHighLevel...)
 *  2. Emailed via Resend if RESEND_API_KEY and LEAD_TO_EMAIL are set (comma-separate multiple recipients)
 *  3. Always logged to the Vercel function log as a fallback.
 */
export const POST: APIRoute = async ({ request }) => {
  const json = (body: any, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  let data: Record<string, string> = {};
  const ct = request.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) data = await request.json();
    else { const fd = await request.formData(); fd.forEach((v, k) => (data[k] = String(v))); }
  } catch { return json({ ok: false, error: 'Bad request' }, 400); }

  if (data.website) return json({ ok: true, spam: true }); // honeypot
  const name = (data.name || '').trim(), phone = (data.phone || '').trim(), email = (data.email || '').trim();
  if (!name || !phone || !email) return json({ ok: false, error: 'Name, phone and email are required' }, 422);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: 'Invalid email' }, 422);

  const store = allLocations[data.store] || null;
  const lead = {
    receivedAt: new Date().toISOString(),
    storeId: data.store, storeName: store?.name, storeCity: store?.city,
    name, phone, email,
    city: data.city || '', interest: data.interest || '', product: data.product || '', message: data.message || '',
    source: data.source || 'website', page: data.page || '',
    site: store ? `https://${store.domain}` : request.headers.get('origin') || '',
    utm: Object.fromEntries(Object.entries(data).filter(([k]) => k.startsWith('utm_'))),
    userAgent: request.headers.get('user-agent') || ''
  };
  console.log('LEAD', JSON.stringify(lead));

  const results: Record<string, string> = {};
  const env = (k: string) => process.env[k] || (import.meta.env as any)[k];

  if (env('LEAD_WEBHOOK_URL')) {
    try {
      const r = await fetch(env('LEAD_WEBHOOK_URL'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
      results.webhook = r.ok ? 'ok' : `http ${r.status}`;
    } catch (e: any) { results.webhook = 'error ' + e.message; }
  }
  if (env('RESEND_API_KEY') && env('LEAD_TO_EMAIL')) {
    const rows = Object.entries({ Store: lead.storeName, Name: name, Phone: phone, Email: email, 'City/town': lead.city, Interest: lead.interest, Product: lead.product, Message: lead.message, Source: lead.source, Page: lead.site + lead.page })
      .filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:6px 12px;color:#666">${k}</td><td style="padding:6px 12px"><b>${String(v).replace(/</g, '&lt;')}</b></td></tr>`).join('');
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env('LEAD_FROM_EMAIL') || 'leads@wellnessshop.ca',
          to: env('LEAD_TO_EMAIL').split(',').map((s: string) => s.trim()),
          reply_to: email,
          subject: `New ${lead.storeCity || ''} lead: ${name} (${lead.interest || lead.product || 'website'})`,
          html: `<h2 style="font-family:sans-serif">${lead.storeName || 'Website'} lead</h2><table style="font-family:sans-serif;border-collapse:collapse">${rows}</table>`
        })
      });
      results.email = r.ok ? 'ok' : `http ${r.status}`;
    } catch (e: any) { results.email = 'error ' + e.message; }
  }
  return json({ ok: true, results });
};
