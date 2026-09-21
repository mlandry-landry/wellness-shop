// Builds one GTM container-import JSON per store so the sites' dataLayer events reach GA4.
// Import each file in Tag Manager: Admin > Import Container > Existing workspace > Merge.
// Usage: node scripts/build-gtm-import.mjs  (writes gtm/<store>.json)
import { writeFileSync, mkdirSync } from 'node:fs';

const ACCOUNT = '1395168673';
const STORES = {
  hamilton:   { container: '118509139', gtm: 'GTM-KL4N34B', ga4: 'G-80CLE6BS01', domain: 'hottubsinhamilton.ca' },
  whitby:     { container: '118511733', gtm: 'GTM-MXXZ4WT', ga4: 'G-JY4HQ7S641', domain: 'hottubsinwhitby.ca' },
  london:     { container: '122510692', gtm: 'GTM-T54MNSJ', ga4: 'G-GR6JCWHN9J', domain: 'hottubsinlondon.ca' },
  burlington: { container: '118506685', gtm: 'GTM-TL59G3K', ga4: 'G-3MVJVZL79C', domain: 'hottubsinburlington.ca' },
  barrie:     { container: '118505925', gtm: 'GTM-WD6CMXS', ga4: 'G-QM1XXGN3KQ', domain: 'hottubsinbarrie.ca' },
  kitchener:  { container: '118488266', gtm: 'GTM-NXQFDGW', ga4: 'G-8YN7JM7EXE', domain: 'hottubsinkitchener.ca' }
};

// Every event the sites push (src/layouts/Base.astro wsTrack + data-track attributes)
const EVENTS = [
  'call_click', 'directions_click', 'specials_click', 'product_cta', 'promo_click', 'salebar_click',
  'lead_submit', 'lead_thank_you', 'claim_open', 'claim_submit', 'claim_prompt_view', 'voucher_view',
  'quiz_start', 'quiz_step', 'quiz_complete'
];
// dataLayer key -> GA4 parameter name
const PARAMS = [
  ['store_id', 'store_id'], ['store_name', 'store_name'], ['phone', 'phone_number'], ['location', 'click_location'],
  ['source', 'lead_source'], ['special', 'special_id'], ['step', 'quiz_step'], ['type', 'quiz_type'], ['top', 'recommended_product']
];

const T = (key, value) => ({ type: 'TEMPLATE', key, value });
const B = (key, value) => ({ type: 'BOOLEAN', key, value: String(value) });

function build(storeId, s) {
  const base = { accountId: ACCOUNT, containerId: s.container };
  let vid = 100, fid = '900';
  const variables = [
    { ...base, variableId: String(vid++), name: 'Const - GA4 Measurement ID', type: 'c', parameter: [T('value', s.ga4)], parentFolderId: fid },
    ...PARAMS.map(([key]) => ({
      ...base, variableId: String(vid++), name: `DLV - ${key}`, type: 'v', parentFolderId: fid,
      parameter: [{ type: 'INTEGER', key: 'dataLayerVersion', value: '2' }, B('setDefaultValue', false), T('name', key)]
    }))
  ];
  const trigger = [
    {
      ...base, triggerId: '200', name: 'CE - Wellness Shop site events', type: 'CUSTOM_EVENT', parentFolderId: fid,
      customEventFilter: [{ type: 'MATCH_REGEX', parameter: [T('arg0', '{{_event}}'), T('arg1', `^(${EVENTS.join('|')})$`)] }]
    },
    {
      ...base, triggerId: '201', name: 'CE - lead_submit', type: 'CUSTOM_EVENT', parentFolderId: fid,
      customEventFilter: [{ type: 'EQUALS', parameter: [T('arg0', '{{_event}}'), T('arg1', 'lead_submit')] }]
    },
    {
      ...base, triggerId: '202', name: 'CE - claim_submit', type: 'CUSTOM_EVENT', parentFolderId: fid,
      customEventFilter: [{ type: 'EQUALS', parameter: [T('arg0', '{{_event}}'), T('arg1', 'claim_submit')] }]
    },
    {
      ...base, triggerId: '203', name: 'CE - call_click', type: 'CUSTOM_EVENT', parentFolderId: fid,
      customEventFilter: [{ type: 'EQUALS', parameter: [T('arg0', '{{_event}}'), T('arg1', 'call_click')] }]
    }
  ];
  const eventSettings = {
    type: 'LIST', key: 'eventSettingsTable',
    list: PARAMS.map(([key, param]) => ({ type: 'MAP', map: [T('parameter', param), T('parameterValue', `{{DLV - ${key}}}`)] }))
  };
  const tag = [
    {
      ...base, tagId: '300', name: 'GA4 Event - Wellness Shop site events', type: 'gaawe', parentFolderId: fid,
      parameter: [B('sendEcommerceData', false), T('eventName', '{{Event}}'), eventSettings, T('measurementIdOverride', '{{Const - GA4 Measurement ID}}')],
      firingTriggerId: ['200'], tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: { type: 'MAP' }, consentSettings: { consentStatus: 'NOT_SET' }
    },
    {
      // Named generate_lead alongside the raw event so GA4's recommended-event reporting picks it up
      ...base, tagId: '301', name: 'GA4 Event - generate_lead (form or claim)', type: 'gaawe', parentFolderId: fid,
      parameter: [B('sendEcommerceData', false), T('eventName', 'generate_lead'), {
        type: 'LIST', key: 'eventSettingsTable', list: [
          { type: 'MAP', map: [T('parameter', 'store_id'), T('parameterValue', '{{DLV - store_id}}')] },
          { type: 'MAP', map: [T('parameter', 'lead_source'), T('parameterValue', '{{DLV - source}}')] },
          { type: 'MAP', map: [T('parameter', 'special_id'), T('parameterValue', '{{DLV - special}}')] },
          { type: 'MAP', map: [T('parameter', 'lead_type'), T('parameterValue', '{{Event}}')] },
          { type: 'MAP', map: [T('parameter', 'currency'), T('parameterValue', 'CAD')] },
          { type: 'MAP', map: [T('parameter', 'value'), T('parameterValue', '1')] }
        ]
      }, T('measurementIdOverride', '{{Const - GA4 Measurement ID}}')],
      firingTriggerId: ['201', '202'], tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: { type: 'MAP' }, consentSettings: { consentStatus: 'NOT_SET' }
    }
  ];
  const folder = [{ ...base, folderId: fid, name: 'Wellness Shop site events' }];
  const builtInVariable = [{ ...base, type: 'EVENT', name: 'Event' }];
  return {
    exportFormatVersion: 2,
    exportTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    containerVersion: {
      path: `accounts/${ACCOUNT}/containers/${s.container}/versions/0`,
      accountId: ACCOUNT, containerId: s.container, containerVersionId: '0',
      container: { path: `accounts/${ACCOUNT}/containers/${s.container}`, accountId: ACCOUNT, containerId: s.container, name: `www.${s.domain}`, publicId: s.gtm, usageContext: ['WEB'] },
      tag, trigger, variable: variables, folder, builtInVariable,
      fingerprint: '0', tagManagerUrl: `https://tagmanager.google.com/#/versions/accounts/${ACCOUNT}/containers/${s.container}/versions/0?apiLink=version`
    }
  };
}

mkdirSync('gtm', { recursive: true });
for (const [id, s] of Object.entries(STORES)) {
  writeFileSync(`gtm/${id}.json`, JSON.stringify(build(id, s), null, 2));
  console.log(`gtm/${id}.json  ${s.gtm} -> ${s.ga4}`);
}
