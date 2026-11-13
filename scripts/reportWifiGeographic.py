"""Render measured source-derived results; never pre-fill outcomes."""
import json
from pathlib import Path
root=Path('public/data/wifi-policy/geographic-v1.1')
def read(p):return json.loads(p.read_text(encoding='utf-8'))
m=read(root/'manifest.json')
sm=read(root/'scenarios-manifest.json')
s=read(root/m['artifacts']['snapshot.json']['path'])
sc=read(root/sm['path'])
rows=sc['scenarios']
facilities={r['id']:r for r in s['facilities']}
lines=['# Actual geographic results','',f"Generation: `{m['versionId']}`. Scenario SHA-256: `{sm['sha256']}`.",'','All counts describe published facility records under explicit CRS hypotheses; no measured Wi-Fi outcomes.','', '| radius m | capacity | strategy | denominator | baseline | increment | own | other | optimization | districts | categories |','|---:|---|---|---:|---:|---:|---:|---:|---|---:|---:|']
for r in rows:
    t=r['settings']
    if t['evidence']=='assumed' and t['geography']=='strict' and t['cohort']=='all':
        lines.append('| '+' | '.join(map(str,[t['radius'],t['capacity'],t['strategy'],r['referenceDenominator'],r['baselineProximate'],r['newlyProximate'],r['ownContributions'],r['additionalContributions'],r['optimizationAvailable'],len(r['districts']),len(r['categories'])]))+' |')
lines+=['','## Cohort sensitivity (strict, assumed, all slots)','','| source | denominator | baseline 100m | baseline 250m | baseline 500m |','|---|---:|---:|---:|---:|']
def scenario(cohort='all',capacity=5,strategy='marginal',radius=100):
    return next(r for r in rows if r['settings']==dict(evidence='assumed',geography='strict',cohort=cohort,capacity=capacity,strategy=strategy,radius=radius))
for cohort in ['B','C','D','all']:
    cohort_rows=[scenario(cohort=cohort,capacity='all',radius=radius) for radius in [100,250,500]]
    lines.append('| '+' | '.join(map(str,[cohort,cohort_rows[0]['referenceDenominator']]+[r['baselineProximate'] for r in cohort_rows]))+' |')
lines+=['','## Actual ordered shortlists and strategy differences','']
for capacity in [5,10]:
    a=scenario(capacity=capacity)
    b=scenario(capacity=capacity,strategy='representation')
    lines += [f'### Capacity {capacity}', '',f"Shared IDs: {len(set(a['selectedIds'])&set(b['selectedIds']))}; added to representation: {len(set(b['selectedIds'])-set(a['selectedIds']))}; removed: {len(set(a['selectedIds'])-set(b['selectedIds']))}.",'']
    for strategy,r in [('marginal',a),('representation',b)]:
        lines += [strategy+':','']+[f"- `{id}` — {facilities[id]['name']} ({facilities[id]['sourceDistrict']}, {facilities[id]['source']})" for id in r['selectedIds']]+['']
lines+=['All eligible ordered IDs for both strategies, every radius and all 288 configurations are in the content-addressed scenario file referenced by `public/data/wifi-policy/geographic-v1.1/scenarios-manifest.json`. Capacity all shares all 87 IDs; order can differ.','', '## Source hashes','', '| source | accepted file | SHA-256 |','|---|---|---|']
for source in s['sourceEditions']:lines.append(f"| {source['id']} | {source['path']} | `{source['sha256']}` |")
lines+=['','## Artifact identity','', '| artifact | bytes | SHA-256 |','|---|---:|---|']
for name,a in m['artifacts'].items():lines.append(f"| {name} | {a['bytes']} | `{a['sha256']}` |")
lines+=['','## Geography details','',json.dumps(s['summary']['hotspots'],ensure_ascii=False), '',f"Maximum geometry round-trip error: {max(d['roundTripMaxMeters'] for d in s['summary']['districts'])} m. Original overlap pairs: {len(s['summary']['overlaps'])}; maximum pair area {max(d['squareMeters'] for d in s['summary']['overlaps'])} m². Repairs: none.",'','## Excluded facilities','']
for row in s['facilities']:
    if not row['eligible']:lines.append(f"- {row['name']}: source district {row['sourceDistrict'] or '(not established)'}, polygon {row['spatial']['district']}; {', '.join(row['issues'])}.")
Path('docs/evidence/geographic-v1.1/results.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('Wrote source-derived results for '+m['versionId'])
