/**
 * Salesforce Web-to-Lead mapping for the Wellness Shop (Jacuzzi Ontario) org.
 * Field IDs verified in Setup on Sep 21, 2026. Enable by setting SALESFORCE_WEB_TO_LEAD_OID
 * (org id 00D1N000002qaXF) on the Vercel projects; the lead API then posts every lead here.
 */
export const SF_ORG_ID_DEFAULT = '00D1N000002qaXF';
export const SF_ENDPOINT = 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8';

/** Closest_Location__c is a restricted picklist on the "Locations" global value set. */
export const SF_LOCATION: Record<string, string> = {
  hamilton: 'Ancaster Store',
  whitby: 'Whitby Store',
  burlington: 'Burlington Store',
  barrie: 'Barrie Store',
  kitchener: 'Kitchener Store',
  london: 'London Store'
};

/** Interested_In__c (multi-select) values that exist in the org. */
export function sfInterest(interest: string, product: string): string {
  const i = (interest || '').toLowerCase(); const p = (product || '').toLowerCase();
  const out: string[] = [];
  if (/swim|pool/.test(i) || /powerpro|poweractive|powerplay|swimlife|swimexpert|swimfit|j-1\d|j-12/.test(p)) out.push('All Season Pool');
  else if (/outdoor sauna|serenity/.test(i + ' ' + p)) out.push('Outdoor Sauna');
  else if (/sauna|sanctuary|clearlight/.test(i + ' ' + p)) out.push('Sauna');
  else if (/plunge|chill/.test(i + ' ' + p)) out.push('Plunge');
  else if (/massage/.test(i + ' ' + p)) out.push('Massage Chair');
  else if (/gazebo|visscher/.test(i + ' ' + p)) out.push('Gazebo');
  else if (/not sure/.test(i)) out.push('Other');
  else out.push('Hot Tub');
  if (/jacuzzi|^j-\d/.test(p)) out.push('Jacuzzi');
  if (/nordic|retreat|sport all-in/.test(p)) out.push('Nordic Spas');
  return [...new Set(out)].join(';');
}

export const SF_FIELDS = {
  closestLocation: '00N1N00000Op2NM',
  interestedIn: '00N1N00000Op2aG',
  entryType: '00NOG000001YF2T',      // Walk_In_Source__c -> "Lead Form"
  city: '00N1N00000PWtFf',           // City__c
  source: '00N1N00000P2u4W',         // Source__c (free text, 250)
  leadSourceDigital: '00N1N00000PWTLf',
  pardotPage: '00NOG000002QWfp',
  submitterIp: '00N1N00000P2u4b',
  gclid: '00NOG000002RElh',
  fbclid: '00NOG00000409Yr',
  utmSource: '00N1N00000Ey1gZ',
  utmMedium: '00N1N00000Ey1gY',
  utmCampaign: '00N1N00000Ey1gW',
  utmContent: '00N1N00000Ey1gX',
  utmTerm: '00N1N00000Ey1ga'
};

export function buildWebToLead(lead: any, oid: string, ip: string): URLSearchParams {
  const [first, ...rest] = String(lead.name || '').trim().split(/\s+/);
  const last = rest.join(' ') || '(web lead)';
  const p = new URLSearchParams();
  p.set('oid', oid);
  p.set('lead_source', 'Website');
  p.set('first_name', first || '');
  p.set('last_name', last);
  p.set('email', lead.email || '');
  p.set('phone', lead.phone || '');
  p.set('mobile', lead.phone || '');
  if (lead.city) { p.set('city', lead.city); p.set(SF_FIELDS.city, lead.city); }
  p.set('state', 'ON'); p.set('country', 'Canada');
  const loc = SF_LOCATION[lead.storeId]; if (loc) p.set(SF_FIELDS.closestLocation, loc);
  p.set(SF_FIELDS.interestedIn, sfInterest(lead.interest, lead.product));
  p.set(SF_FIELDS.entryType, 'Lead Form');
  p.set(SF_FIELDS.source, `${(lead.site || '').replace(/^https?:\/\//, '')} / ${lead.source}`.slice(0, 250));
  p.set(SF_FIELDS.leadSourceDigital, String(lead.source || '').slice(0, 200));
  p.set(SF_FIELDS.pardotPage, `${lead.site}${lead.page}`.slice(0, 255));
  if (ip) p.set(SF_FIELDS.submitterIp, ip.slice(0, 250));
  const u = lead.utm || {};
  if (u.gclid) p.set(SF_FIELDS.gclid, u.gclid);
  if (u.fbclid) p.set(SF_FIELDS.fbclid, u.fbclid);
  if (u.utm_source) p.set(SF_FIELDS.utmSource, u.utm_source);
  if (u.utm_medium) p.set(SF_FIELDS.utmMedium, u.utm_medium);
  if (u.utm_campaign) p.set(SF_FIELDS.utmCampaign, u.utm_campaign);
  if (u.utm_content) p.set(SF_FIELDS.utmContent, u.utm_content);
  if (u.utm_term) p.set(SF_FIELDS.utmTerm, u.utm_term);
  const desc = [
    lead.product ? `Product: ${lead.product}` : '',
    lead.interest ? `Interest: ${lead.interest}` : '',
    lead.voucherCode ? `Voucher: ${lead.voucherCode} (expires ${lead.voucherExpires})` : '',
    lead.message ? `Message: ${lead.message}` : '',
    `Submitted from ${lead.site}${lead.page} (${lead.source}) at ${lead.receivedAt}`
  ].filter(Boolean).join('\n');
  p.set('description', desc.slice(0, 32000));
  return p;
}
