import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { geographicPython } from '../scripts/buildWifiDistrictBoundaries.js';

test('retained facilities and bounded ODS parsing preserve evidence, assumptions and individual exclusions', () => {
  const program = `
import copy,io,json,zipfile,tempfile
from pathlib import Path
from scripts.geographic.facilities import parse_records,parse_ods,number,audit_facilities,qualify_identities
from scripts.geographic.boundaries import build_boundaries
root=Path('.')
boundaries,_=build_boundaries(root,False)
report=audit_facilities(root,boundaries['features'])
assert report['summary']['examined']==91
assert report['summary']['verified']==0
assert report['summary']['assumptionTested']==87
assert report['summary']['unresolved']==4
assert report['summary']['districtDisagreements']==3
assert len(set(r['id'] for r in report['records']))==91
assert all(r['sourceEdition']==r['sourceSha256'] for r in report['records'])
assert all(r['sourceCrs'] is None for r in report['records'])
assert len(parse_records((root/'data/raw/wifi-policy/B-2026-06-10.csv').read_bytes(),'B'))==70
assert len(parse_records((root/'data/raw/wifi-policy/D-2026-03-02.csv').read_bytes(),'D'))==12
activity=parse_records((root/'data/raw/wifi-policy/C-2025-12-18.ods').read_bytes(),'C')
assert len(activity)==9 and activity[0]['座標X']=='300625.006'
for value in ['', 'NaN','inf','bad']:
 try: number(value); raise AssertionError('accepted invalid number')
 except ValueError: pass
for source in ['B','C','D']:
 try: parse_records(b'bad\\nrow',source); raise AssertionError('accepted missing headers')
 except (ValueError,zipfile.BadZipFile): pass
clone=copy.deepcopy(report['records'][0]);dup=copy.deepcopy(clone)
diags=qualify_identities([clone,dup])
assert diags[0]['kind']=='duplicate-composite'
assert not clone['identityQualified'] and clone['evidenceTier']=='unresolved'
assert clone['id']!=dup['id']
conflict=copy.deepcopy(report['records'][0]);other=copy.deepcopy(conflict);other['longitude']+=0.01
assert qualify_identities([conflict,other])[0]['kind']=='conflicting-composite'
with tempfile.TemporaryDirectory(dir=root) as tmp:
 temp=Path(tmp);(temp/'data/raw/wifi-policy').mkdir(parents=True)
 manifest=json.loads((root/'data/raw/wifi-policy/acquisition-manifest.json').read_text(encoding='utf-8'))
 manifest['sources']=[s for s in manifest['sources'] if s['id']=='B']
 (temp/'data/raw/wifi-policy/acquisition-manifest.json').write_text(json.dumps(manifest),encoding='utf-8')
 (temp/manifest['sources'][0]['path']).write_bytes(b'tampered')
 try:audit_facilities(temp,boundaries['features']);raise AssertionError('accepted hash mismatch')
 except ValueError as error:assert 'hash mismatch' in str(error)
def ods(content):
 stream=io.BytesIO()
 with zipfile.ZipFile(stream,'w') as z:z.writestr('content.xml',content)
 return stream.getvalue()
xml='''<document xmlns:t="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:x="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><t:table><t:table-row><t:table-cell><x:p>A</x:p></t:table-cell><t:table-cell><x:p>B</x:p></t:table-cell></t:table-row><t:table-row><t:table-cell t:number-columns-repeated="2"><x:p>same</x:p></t:table-cell><t:table-cell t:number-columns-repeated="16382"/></t:table-row></t:table></document>'''
assert parse_ods(ods(xml))==[{'A':'same','B':'same'}]
try: parse_ods(ods(xml.replace('repeated="2"','repeated="999999"')));raise AssertionError('unbounded repeat')
except ValueError:pass
print(json.dumps(report['summary']))
`;
  const result = spawnSync(geographicPython(), ['-c', program], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PROJ_NETWORK: 'OFF' } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).examined, 91);
});
