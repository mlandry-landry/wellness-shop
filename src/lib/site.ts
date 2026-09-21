import site from '@/data/site.json';
import promos from '@/data/promos.json';
import specialsData from '@/data/specials.json';
import productsData from '@/data/products.json';

import hamilton from '@/data/locations/hamilton.json';
import whitby from '@/data/locations/whitby.json';
import burlington from '@/data/locations/burlington.json';
import barrie from '@/data/locations/barrie.json';
import kitchener from '@/data/locations/kitchener.json';
import london from '@/data/locations/london.json';

import copyHamilton from '@/data/copy/hamilton.json';
import copyWhitby from '@/data/copy/whitby.json';
import copyBurlington from '@/data/copy/burlington.json';
import copyBarrie from '@/data/copy/barrie.json';
import copyKitchener from '@/data/copy/kitchener.json';
import copyLondon from '@/data/copy/london.json';

export type Location = typeof kitchener;
export type Product = (typeof productsData)[number] & Record<string, any>;
export type Special = (typeof specialsData.specials)[number];

export const allLocations: Record<string, Location> = { hamilton, whitby, burlington, barrie, kitchener, london } as any;

const SITE_ID = (import.meta.env.SITE_ID as string) || 'kitchener';
export const location: Location = allLocations[SITE_ID] ?? kitchener;
export const siteId = location.id;
export const siteUrl = `https://${location.domain}`;

/** Store-specific written content (src/data/copy/<store>.json): category intros, FAQs, product notes, town pages. */
export type StoreCopy = typeof copyKitchener;
const allCopy: Record<string, StoreCopy> = { hamilton: copyHamilton, whitby: copyWhitby, burlington: copyBurlington, barrie: copyBarrie, kitchener: copyKitchener, london: copyLondon } as any;
export const copy: StoreCopy = allCopy[siteId] ?? copyKitchener;
/** Size bucket used to pick the local product note for a hot tub. */
export function tubSize(p: Product): 'small' | 'medium' | 'large' {
  if (p.category !== 'hot-tub') return 'medium';
  if ((p.seats && p.seats <= 4) || /110V/i.test(p.model || '')) return 'small';
  if (p.seats && p.seats >= 7) return 'large';
  return 'medium';
}
export { site, promos };

export const products: Product[] = productsData as Product[];

export const categories = {
  'hot-tub': { path: '/hot-tubs/', label: 'Hot Tubs', singular: 'Hot Tub' },
  'swim-spa': { path: '/swim-spas/', label: 'Swim Spas', singular: 'Swim Spa' },
  sauna: { path: '/saunas/', label: 'Saunas', singular: 'Sauna' },
  'cold-plunge': { path: '/cold-plunge/', label: 'Cold Plunge', singular: 'Chill Tub' },
  'massage-chair': { path: '/massage-chairs/', label: 'Massage Chairs', singular: 'Massage Chair' },
  gazebo: { path: '/gazebos/', label: 'Gazebos', singular: 'Gazebo' }
} as const;

export function byCategory(cat: keyof typeof categories): Product[] {
  return products.filter((p) => p.category === cat);
}
export function productPath(p: Product): string {
  return `${categories[p.category as keyof typeof categories].path}${p.slug}/`;
}

/** Active specials for this store (global 'all' plus store-specific). */
export const specials: Special[] = specialsData.specials.filter(
  (s) => s.active && (s.locations.includes('all') || s.locations.includes(siteId))
);
export const specialsIntro = specialsData.pageIntro;
const focus = (location as any).homeFocus || 'hot-tub';
export const activeBanners = (promos.banners as any[]).filter((b) => b.active).sort((a, b) => (b.category === focus ? 1 : 0) - (a.category === focus ? 1 : 0)).slice(0, 3);

/** Number the public sees. Falls back to the real store line until a tracking number is set. */
export const displayPhone: string = (location as any).trackingPhone || location.phone;
export const telHref = `tel:+1${displayPhone.replace(/\D/g, '')}`;

export function money(n?: number | null): string {
  if (n == null) return '';
  return '$' + Math.round(n).toLocaleString('en-CA');
}
export function biweekly(n?: number | null): string {
  if (n == null) return '';
  return `$${n.toFixed(2)} bi-weekly`;
}
/** Matches the financing disclaimer on wellnessshop.ca */
export const financeNote = '0% interest for 12 months bi-weekly finance payment, on approved credit. Amortization period varies by product. Other financing options are available.';

export const fullAddress = [location.street + (location.unit ? `, ${location.unit}` : ''), `${location.locality}, ON ${location.postal}`].join(', ');

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
export function hoursRows() {
  const h = location.hours as Record<string, [string, string]>;
  const fmt = (t: string) => {
    const [H, M] = t.split(':').map(Number);
    const ampm = H >= 12 ? 'PM' : 'AM';
    const hh = H % 12 === 0 ? 12 : H % 12;
    return M ? `${hh}:${String(M).padStart(2, '0')} ${ampm}` : `${hh} ${ampm}`;
  };
  return [
    { label: 'Monday to Friday', value: `${fmt(h.monday[0])} to ${fmt(h.monday[1])}` },
    { label: 'Saturday', value: `${fmt(h.saturday[0])} to ${fmt(h.saturday[1])}` },
    { label: 'Sunday', value: `${fmt(h.sunday[0])} to ${fmt(h.sunday[1])}` }
  ];
}
/** Schema.org openingHoursSpecification */
export function openingHoursSpec() {
  const h = location.hours as Record<string, [string, string]>;
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  return dayNames.map((d) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: cap(d), opens: h[d][0], closes: h[d][1] }));
}
/** Hours JSON for the client-side "Open now" badge */
export const hoursJson = JSON.stringify(location.hours);

export function otherLocations(): Location[] {
  return Object.values(allLocations).filter((l) => l.id !== siteId);
}

export function cityTitle(s: string) {
  return `${s} | ${location.name}`;
}

/** Wrap every product model name in a paragraph with a link to its page (longest names first so J-508L wins over J-508). */
const modelIndex = [...products]
  .map((p) => ({ p, names: [p.model, ...(p.brand === 'Aquasolus' ? [p.model.replace(/^The /, '')] : [])] }))
  .flatMap(({ p, names }) => names.map((n) => ({ p, n })))
  .sort((a, b) => b.n.length - a.n.length);
export function linkModels(text: string, exceptSlug?: string): string {
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
  let out = esc(text);
  const used = new Set<string>();
  for (const { p, n } of modelIndex) {
    if (p.slug === exceptSlug || used.has(p.slug)) continue;
    // Match the model name as a whole word, not already inside a link; link only the first mention.
    const re = new RegExp(`(^|[^\\w>-])(${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\w-])`);
    if (re.test(out)) { out = out.replace(re, (_, pre, name) => `${pre}<a href="${productPath(p)}">${name}</a>`); used.add(p.slug); }
  }
  return out;
}
