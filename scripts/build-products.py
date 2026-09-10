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
      'msrp':d['MSRP (CAD)'],'sale':d['Sale / Promo (CAD)'],'weekly':d['Weekly Pmt (CAD)'],
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
      'msrp':d['MSRP (CAD)'],'sale':d['Sale / Promo (CAD)'],'weekly':d['Weekly Pmt (CAD)'],
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
    products.append({'slug':slugify(model),'category':'sauna','subcategory':'infrared','brand':clean(brand),'model':model,'series':series,
      'seats':cap,'msrp':msrp,'sale':None,'weekly':None,'saunaType':typ,'sourceUrl':url})
for r in rows[h2+1:]:
    if not r[0]: continue
    brand,model,temp,seating,dims,mk,mc,sk,sc,bw=r[:10]
    products.append({'slug':slugify(model),'category':'sauna','subcategory':'outdoor','brand':brand,'model':model,'series':'Serenity',
      'maxTemp':temp,'seating':seating,'dimensions':dims,'msrp':mk,'sale':sk,'msrpClear':mc,'saleClear':sc,'biweekly':bw,
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
    img=f"public/images/products/{p['slug']}.webp"
    p['image']=f"/images/products/{p['slug']}.webp" if os.path.exists(img) else None
    if p.get('msrp') and p.get('sale'): p['savings']=p['msrp']-p['sale']
json.dump(products,open('src/data/products.json','w'),indent=1,ensure_ascii=False)
print(len(products),'products;',sum(1 for p in products if p['image']),'with images')
print('no image:',[p['slug'] for p in products if not p['image'] and not p.get('quoteOnly')])
print('max savings:',max(p.get('savings',0) for p in products if p['category']=='hot-tub'), 'min weekly', min(p['weekly'] for p in products if p.get('weekly')))
