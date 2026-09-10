"""Rebuild src/data/products.json from data-source-catalog.xlsx.
Run: python3 scripts/build-products.py
Only the spreadsheet is the source of truth for specs. Prices can also be edited directly in products.json."""
import openpyxl, json, re, os
wb=openpyxl.load_workbook('data-source-catalog.xlsx',data_only=True)
def slugify(s):
    s=s.replace('™','').replace('®','').lower()
    s=re.sub(r'[^a-z0-9]+','-',s).strip('-')
    return s
def clean(s):
    if s in (None,'-',''): return None
    if isinstance(s,str): return s.replace('™','').replace('®','').replace(' – ',' ').replace('–','-').replace('—',',').strip()
    return s
products=[]
# The spreadsheet's Clearlight prices were wrong (looked like old/USD figures). These were read from the live
# wellnessshop.ca product pages on Sep 10, 2026: MSRP / promo / bi-weekly for Basswood, then Mahogany.
CLEARLIGHT={
 'sanctuary-1':dict(msrp=11495,sale=10495,bw=21.09,msrpM=11995,saleM=10995,bwM=22.04,seats=1,notes='Includes a free AROMA ONE aromatherapy diffuser.'),
 'sanctuary-2':dict(msrp=12795,sale=11795,bw=23.56,msrpM=13295,saleM=12295,bwM=24.51,seats=2,notes='Includes the Chill Tubs Essential bundle (about $3,900 value) at no charge.'),
 'sanctuary-3':dict(msrp=13995,sale=12995,bw=25.84,msrpM=14495,saleM=13495,bwM=26.79,seats=3,notes='Includes the Chill Tubs Essential bundle (about $3,900 value) at no charge.'),
 'sanctuary-5':dict(msrp=14995,sale=13995,bw=27.74,msrpM=15495,saleM=14495,bwM=28.69,seats=3),
 'sanctuary-y':dict(msrp=14995,sale=13995,bw=27.74,msrpM=15495,saleM=14495,bwM=28.69,seats=4,notes='Includes the Chill Tubs Essential bundle (about $3,900 value) at no charge.'),
 'sanctuary-c':dict(msrp=15495,sale=14495,bw=28.69,msrpM=16495,saleM=15495,bwM=30.59,seats=4),
 'sanctuary-retreat':dict(msrp=16295,sale=15295,bw=30.21,msrpM=16795,saleM=15795,bwM=31.16,seats=4),
}
# Hot tubs
ws=wb['Hot Tubs']
rows=list(ws.iter_rows(values_only=True))
hi=next(i for i,r in enumerate(rows) if r[0]=='Category'); hdr=rows[hi]
for r in rows[hi+1:]:
    if not r[0]: continue
    d=dict(zip(hdr,r))
    model=clean(d['Model'])
    slug=slugify(model)
    if slug=='j-215-2': slug='j-215'
    products.append({
      'slug':slug,'category':'hot-tub','brand':clean(d['Brand']),'model':model,'series':clean(d['Collection / Series']),
      'seats':d['Seats (Adults)'],'jets':d['Jets'],'seating':clean(d['Seating Type']),
      'msrp':d['MSRP (CAD)'],'sale':d['Sale / Promo (CAD)'],'biweekly':d['Weekly Pmt (CAD)'],
      'dimensions':clean(d['Dimensions (in)']),'volumeGal':clean(d['Volume (gal)']),'volumeL':clean(d['Volume (L)']),
      'dryWeightLb':clean(d['Dry Wt (lb)']),'filledWeightLb':clean(d['Filled Wt (lb)']),
      'filtration':clean(d['Filtration']),'waterCare':clean(d['Water Management']),'electrical':clean(d['Electrical']),
      'notes':clean(d['Notes']),'sourceUrl':d['Product URL']})
# Swim spas
ws=wb['Swim Spas (All Season Pools)']
rows=list(ws.iter_rows(values_only=True))
hi=next(i for i,r in enumerate(rows) if r[0]=='Brand'); hdr=rows[hi]
for r in rows[hi+1:]:
    if not r[0]: continue
    d=dict(zip(hdr,r)); model=clean(d['Model'])
    products.append({
      'slug':slugify(model),'category':'swim-spa','brand':clean(d['Brand']),'model':model,'series':clean(d['Series']),
      'lengthFt':d['Length (ft)'],'seats':d['Seats'],'jets':d['Jets'],
      'msrp':d['MSRP (CAD)'],'sale':d['Sale / Promo (CAD)'],'biweekly':d['Weekly Pmt (CAD)'],
      'dimensions':clean(d['Dimensions (in)']),'volumeGal':clean(d['Volume (gal)']),'volumeL':clean(d['Volume (L)']),
      'dryWeightLb':clean(d['Dry Wt (lb)']),'filledWeightLb':clean(d['Filled Wt (lb)']),
      'waterCare':clean(d['Water Management']),'electrical':clean(d['Electrical']),'notes':clean(d['Notes']),'sourceUrl':d['Product URL']})
# Saunas
ws=wb['Saunas']; rows=list(ws.iter_rows(values_only=True))
h1=next(i for i,r in enumerate(rows) if r[0]=='Brand' and r[2]=='Series')
h2=next(i for i,r in enumerate(rows) if r[0]=='Brand' and r[2]=='Max Temp')
for r in rows[h1+1:h2]:
    if not r[0] or r[0].startswith('Serenity'): continue
    brand,model,series,cap,msrp,typ,url=r[:7]
    slug=slugify(model)
    o=CLEARLIGHT.get(slug)
    if not o: raise SystemExit(f'No verified pricing for {slug}; add it to CLEARLIGHT')
    products.append({'slug':slug,'category':'sauna','subcategory':'infrared','brand':clean(brand),'model':model,'series':series,
      'seats':o.get('seats',cap),'msrp':o['msrp'],'sale':o['sale'],'biweekly':o['bw'],'msrpMahogany':o['msrpM'],'saleMahogany':o['saleM'],'biweeklyMahogany':o['bwM'],
      'woodOptions':'Basswood (shown) or Mahogany','notes':o.get('notes'),'saunaType':typ,'sourceUrl':url})
for r in rows[h2+1:]:
    if not r[0]: continue
    brand,model,temp,seating,dims,mk,mc,sk,sc,bw=r[:10]
    products.append({'slug':slugify(model),'category':'sauna','subcategory':'outdoor','brand':brand,'model':model,'series':'Serenity',
      'maxTemp':temp,'seating':seating,'dimensions':dims,'msrp':mk,'sale':sk,'msrpClear':mc,'saleClear':sc,
      'biweekly':float(bw.split('/')[0].strip().lstrip('$')),'biweeklyClear':float(bw.split('/')[1].strip().lstrip('$')),'woodOptions':'Knotty cedar (shown) or clear cedar',
      'notes':'Heater sold separately. Knotty cedar pricing shown; clear cedar available.','sourceUrl':'https://www.wellnessshop.ca/outdoor-saunas/'})
# Quote-only
ws=wb['Chill Tubs (Cold Plunge)']; rows=list(ws.iter_rows(values_only=True))
hi=next(i for i,r in enumerate(rows) if r[0]=='Brand')
for r in rows[hi+1:]:
    if not r[0]: continue
    brand,model,cap,wt,basis,url=r[:6]
    products.append({'slug':slugify(model),'category':'cold-plunge','brand':brand,'model':model,'capacity':cap,'weight':wt,'msrp':None,'sale':None,'quoteOnly':True,'sourceUrl':url})
ws=wb['Massage Chairs']; rows=list(ws.iter_rows(values_only=True))
hi=next(i for i,r in enumerate(rows) if r[0]=='Brand')
for r in rows[hi+1:]:
    if not r[0]: continue
    brand,model,basis,url=r[:4]
    products.append({'slug':slugify(model),'category':'massage-chair','brand':brand,'model':model,'msrp':None,'sale':None,'quoteOnly':True,'sourceUrl':url})
ws=wb['Gazebos']; rows=list(ws.iter_rows(values_only=True))
hi=next(i for i,r in enumerate(rows) if r[0]=='Brand')
for r in rows[hi+1:]:
    if not r[0]: continue
    brand,model,size,style,basis,url=r[:6]
    products.append({'slug':slugify(model),'category':'gazebo','brand':brand,'model':model,'size':size,'style':style,'msrp':None,'sale':None,'quoteOnly':True,'sourceUrl':url})
# images
for p in products:
    if p.get('notes'):
        p['notes']=re.sub(r'; FREE 25th-Anniversary bundle \(\$4,292 value\)','',p['notes'])
        p['notes']=re.sub(r'From \$[\d.]+ bi-weekly','Includes White Glove delivery and setup (up to $1,900 value)',p['notes'])
    img=f"public/images/products/{p['slug']}.webp"
    p['image']=f"/images/products/{p['slug']}.webp" if os.path.exists(img) else None
    if p.get('msrp') and p.get('sale'): p['savings']=p['msrp']-p['sale']
json.dump(products,open('src/data/products.json','w'),indent=1,ensure_ascii=False)
print(len(products),'products;',sum(1 for p in products if p['image']),'with images')
print('no image:',[p['slug'] for p in products if not p['image'] and not p.get('quoteOnly')])
print('max savings:',max(p.get('savings',0) for p in products if p['category']=='hot-tub'), 'min bi-weekly', min(p['biweekly'] for p in products if p.get('biweekly')))
